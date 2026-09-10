<?php

namespace Nirvona\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

/**
 * CORSMiddleware
 *
 * Handles CORS (Cross-Origin Resource Sharing) headers.
 * Whitelist only trusted frontend domains.
 */
class CORSMiddleware implements MiddlewareInterface
{
    private array $allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        // Add production domains here
        // 'https://nirvona.example.com',
    ];

    public function process(Request $request, RequestHandler $handler): Response
    {
        $origin = $request->getHeaderLine('Origin');

        // Check if origin is allowed
        if (!in_array($origin, $this->allowedOrigins)) {
            return $this->forbiddenResponse();
        }

        // Handle preflight request
        if ($request->getMethod() === 'OPTIONS') {
            return $this->preflightResponse($origin);
        }

        // Process request
        $response = $handler->handle($request);

        // Add CORS headers to response
        return $response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Credentials', 'true')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->withHeader('Access-Control-Max-Age', '86400');
    }

    /**
     * Handle preflight request
     *
     * @param string $origin
     * @return Response
     */
    private function preflightResponse(string $origin): Response
    {
        $response = new \Slim\Psr7\Response();
        return $response
            ->withStatus(200)
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->withHeader('Access-Control-Max-Age', '86400');
    }

    /**
     * Return forbidden response for disallowed origins
     *
     * @return Response
     */
    private function forbiddenResponse(): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => 'Origin not allowed',
        ]));
        return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
    }
}
