<?php

namespace Nirvona\Controllers;

use Nirvona\Services\AuthService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * AuthController
 *
 * Handles HTTP requests for login and "who am I" lookups. Student
 * registration stays on StudentController/register (it owns creating
 * the student end-to-end and now also returns a token on success).
 */
class AuthController
{
    private AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * POST /api/auth/login
     */
    public function loginStudent(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->authService->loginStudent($data['email'] ?? '', $data['password'] ?? '');
        $statusCode = $result['success'] ? 200 : 401;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/auth/admin/login
     */
    public function loginAdmin(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->authService->loginAdmin($data['email'] ?? '', $data['password'] ?? '');
        $statusCode = $result['success'] ? 200 : 401;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/auth/me
     *
     * Protected by AuthMiddleware - userId/role come from the verified
     * token, not the client.
     */
    public function me(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('userId');
        $role = $request->getAttribute('role');

        $result = $this->authService->me($userId, $role);
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
}
