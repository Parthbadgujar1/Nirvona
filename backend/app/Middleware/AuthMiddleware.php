<?php

namespace Nirvona\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

/**
 * AuthMiddleware
 *
 * Validates JWT token in Authorization header.
 * Adds user information to request if valid.
 */
class AuthMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader)) {
            return $this->unauthorizedResponse();
        }

        // Extract token from "Bearer {token}"
        if (strpos($authHeader, 'Bearer ') !== 0) {
            return $this->unauthorizedResponse();
        }

        $token = substr($authHeader, 7);

        // Validate JWT token
        // In production: use firebase/php-jwt to decode and verify
        if (!$this->validateToken($token)) {
            return $this->unauthorizedResponse();
        }

        // Add user to request
        $payload = $this->decodeToken($token);
        $request = $request->withAttribute('userId', $payload['sub'] ?? null);

        return $handler->handle($request);
    }

    /**
     * Validate JWT token
     *
     * @param string $token
     * @return bool
     */
    private function validateToken(string $token): bool
    {
        // In production: decode with Firebase JWT library
        // For demo: simple validation
        return !empty($token) && strlen($token) > 20;
    }

    /**
     * Decode JWT token
     *
     * @param string $token
     * @return array
     */
    private function decodeToken(string $token): array
    {
        // In production: use Firebase JWT decoder
        return [
            'sub' => 'user_id_from_token',
            'iat' => time(),
            'exp' => time() + 3600,
        ];
    }

    /**
     * Return unauthorized response
     *
     * @return Response
     */
    private function unauthorizedResponse(): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => [
                'code' => 'UNAUTHORIZED',
                'message' => 'Invalid or missing authorization token',
            ],
        ]));
        return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
    }
}
