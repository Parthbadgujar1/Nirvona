<?php

namespace Nirvona\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

/**
 * PublicCacheMiddleware
 *
 * For the PUBLIC catalogue only (courses, packages, syllabus - identical for
 * every visitor). Lets browsers and any CDN/reverse proxy reuse a response
 * for a few seconds and revalidate cheaply afterwards:
 *
 *   - `Cache-Control: public, max-age=10, must-revalidate` - a page that asks
 *     twice within 10 s doesn't hit the server at all, and 1000 visitors
 *     loading the landing page in the same moment cost the origin a handful
 *     of requests when a proxy sits in front. Short on purpose: an admin edit
 *     (price, name, retired package) reaches every visitor within ~10 s.
 *   - `ETag` + `If-None-Match` - after that, an unchanged catalogue costs a
 *     bodyless 304.
 *
 * Only successful GETs are cached. Never attach this to a route that returns
 * anything user-specific.
 */
class PublicCacheMiddleware implements MiddlewareInterface
{
    private const MAX_AGE = 10;

    public function process(Request $request, RequestHandler $handler): Response
    {
        $response = $handler->handle($request);

        if ($request->getMethod() !== 'GET' || $response->getStatusCode() !== 200) {
            return $response;
        }

        $body = (string) $response->getBody();
        $etag = '"' . substr(hash('sha256', $body), 0, 32) . '"';
        $response = $response
            ->withHeader('Cache-Control', 'public, max-age=' . self::MAX_AGE . ', must-revalidate')
            ->withHeader('ETag', $etag)
            ->withHeader('Vary', 'Origin, Accept-Encoding');

        $ifNoneMatch = $request->getHeaderLine('If-None-Match');
        if ($ifNoneMatch !== '' && in_array($etag, array_map('trim', explode(',', str_replace('W/', '', $ifNoneMatch))), true)) {
            return (new \Slim\Psr7\Response(304))
                ->withHeader('ETag', $etag)
                ->withHeader('Cache-Control', 'public, max-age=' . self::MAX_AGE . ', must-revalidate')
                ->withHeader('Vary', 'Origin, Accept-Encoding');
        }

        return $response;
    }
}
