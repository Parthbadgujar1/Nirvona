<?php

namespace Nirvona\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

/**
 * SecurityHeadersMiddleware
 *
 * Outermost middleware: applies to every response (including 4xx/5xx and
 * rate-limit/CORS rejections).
 *
 *  - Refuses oversized request bodies before anything parses them.
 *  - Adds the standard hardening headers. The API only ever returns JSON, so
 *    the CSP is "nothing may load or frame this" - if a response were ever
 *    rendered as a page, no script could run in it.
 *  - Marks responses `no-store` unless a route deliberately set caching (the
 *    public catalogue does): a signed-in student's payments, results or
 *    admit card must never sit in a shared proxy or browser cache.
 */
class SecurityHeadersMiddleware implements MiddlewareInterface
{
    /** Largest accepted request body. Student response uploads are the biggest legitimate payload. */
    private const MAX_BODY_BYTES = 2 * 1024 * 1024;

    public function process(Request $request, RequestHandler $handler): Response
    {
        $size = $request->getBody()->getSize();
        $declared = (int) $request->getHeaderLine('Content-Length');
        if (($size !== null && $size > self::MAX_BODY_BYTES) || $declared > self::MAX_BODY_BYTES) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => ['code' => 'PAYLOAD_TOO_LARGE', 'message' => 'Request body is too large.'],
            ]));
            return $this->harden($response->withStatus(413)->withHeader('Content-Type', 'application/json'), $request);
        }

        return $this->harden($handler->handle($request), $request);
    }

    private function harden(Response $response, Request $request): Response
    {
        $response = $response
            ->withHeader('X-Content-Type-Options', 'nosniff')
            ->withHeader('X-Frame-Options', 'DENY')
            ->withHeader('Referrer-Policy', 'no-referrer')
            ->withHeader('Cross-Origin-Resource-Policy', 'same-site')
            ->withHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
            ->withHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
            ->withoutHeader('X-Powered-By');

        $https = ($request->getServerParams()['HTTPS'] ?? '') === 'on'
            || strtolower($request->getHeaderLine('X-Forwarded-Proto')) === 'https';
        if ($https) {
            $response = $response->withHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        if (!$response->hasHeader('Cache-Control')) {
            $response = $response
                ->withHeader('Cache-Control', 'no-store')
                ->withHeader('Pragma', 'no-cache');
        }

        return $response;
    }
}
