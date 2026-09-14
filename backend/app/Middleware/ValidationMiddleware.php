<?php

namespace Nirvona\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

/**
 * ValidationMiddleware
 *
 * Validates request content-type and structure.
 */
class ValidationMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        // Skip validation for GET and DELETE requests
        if (in_array($request->getMethod(), ['GET', 'DELETE', 'OPTIONS'])) {
            return $handler->handle($request);
        }

        // Check content-type for POST/PUT
        $contentType = $request->getHeaderLine('Content-Type');

        if (empty($contentType) || strpos($contentType, 'application/json') === false) {
            return $this->invalidContentTypeResponse();
        }

        // Try to parse JSON body
        $body = (string)$request->getBody();
        if (!empty($body)) {
            try {
                json_decode($body, true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException $e) {
                return $this->invalidJsonResponse();
            }
        }

        return $handler->handle($request);
    }

    /**
     * Return invalid content-type response
     *
     * @return Response
     */
    private function invalidContentTypeResponse(): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => [
                'code' => 'INVALID_CONTENT_TYPE',
                'message' => 'Content-Type must be application/json',
            ],
        ]));
        return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }

    /**
     * Return invalid JSON response
     *
     * @return Response
     */
    private function invalidJsonResponse(): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => [
                'code' => 'INVALID_JSON',
                'message' => 'Request body must be valid JSON',
            ],
        ]));
        return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }
}
