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
    /** @var string[] */
    private array $allowedOrigins;

    public function __construct()
    {
        // FRONTEND_URL plus any comma-separated CORS_ORIGINS (production domains),
        // plus the local dev servers when running in development.
        $origins = array_filter(array_map('trim', array_merge(
            [$_ENV['FRONTEND_URL'] ?? ''],
            explode(',', $_ENV['CORS_ORIGINS'] ?? '')
        )));
        if (($_ENV['APP_ENV'] ?? 'production') === 'development') {
            $origins = array_merge($origins, ['http://localhost:3000', 'http://localhost:3001']);
        }
        $this->allowedOrigins = array_values(array_unique(array_map(fn($o) => rtrim($o, '/'), $origins)));
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $origin = $request->getHeaderLine('Origin');

        // Requests without an Origin header aren't cross-origin browser
        // requests at all (curl, server-to-server calls, health checks) -
        // CORS doesn't apply to them, so let them through untouched.
        if ($origin === '') {
            return $handler->handle($request);
        }

        // Reject cross-origin browser requests from domains we don't trust
        if (!in_array($origin, $this->allowedOrigins, true)) {
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
