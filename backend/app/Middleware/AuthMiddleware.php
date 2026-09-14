<?php

namespace Nirvona\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Nirvona\Services\JwtService;

/**
 * AuthMiddleware
 *
 * Validates a JWT in the Authorization header and attaches `userId` +
 * `role` to the request for downstream controllers/services. Real
 * verification via JwtService (signature + expiry checked against
 * JWT_SECRET) - this previously accepted any string over 20 characters
 * as a "valid" token and was never even attached to the app, so every
 * "protected" route was both unauthenticated and unenforced.
 */
class AuthMiddleware implements MiddlewareInterface
{
    private JwtService $jwtService;

    public function __construct(JwtService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
            return $this->unauthorizedResponse('Missing bearer token');
        }

        $token = substr($authHeader, 7);
        $claims = $this->jwtService->verify($token);

        if ($claims === null) {
            return $this->unauthorizedResponse('Invalid or expired token');
        }

        $request = $request
            ->withAttribute('userId', $claims['sub'] ?? null)
            ->withAttribute('role', $claims['role'] ?? null)
            ->withAttribute('claims', $claims);

        return $handler->handle($request);
    }

    /**
     * Return unauthorized response
     *
     * @param string $message
     * @return Response
     */
    private function unauthorizedResponse(string $message): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => [
                'code' => 'UNAUTHORIZED',
                'message' => $message,
            ],
        ]));
        return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
    }
}
