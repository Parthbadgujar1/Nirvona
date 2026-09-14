<?php

namespace Nirvona\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Nirvona\Services\JwtService;

/**
 * AdminMiddleware
 *
 * Same JWT verification as AuthMiddleware, plus a role check: the
 * token's `role` claim must be "admin". This is what actually enforces
 * AdminController's routes "require admin authentication" (previously
 * just a docblock comment - nothing checked it).
 */
class AdminMiddleware implements MiddlewareInterface
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
            return $this->errorResponse(401, 'UNAUTHORIZED', 'Missing bearer token');
        }

        $token = substr($authHeader, 7);
        $claims = $this->jwtService->verify($token);

        if ($claims === null) {
            return $this->errorResponse(401, 'UNAUTHORIZED', 'Invalid or expired token');
        }

        if (($claims['role'] ?? null) !== 'admin') {
            return $this->errorResponse(403, 'FORBIDDEN', 'Admin access required');
        }

        $request = $request
            ->withAttribute('userId', $claims['sub'] ?? null)
            ->withAttribute('role', $claims['role'] ?? null)
            ->withAttribute('adminRole', $claims['adminRole'] ?? null)
            ->withAttribute('claims', $claims);

        return $handler->handle($request);
    }

    /**
     * @param int $status
     * @param string $code
     * @param string $message
     * @return Response
     */
    private function errorResponse(int $status, string $code, string $message): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
        ]));
        return $response->withStatus($status)->withHeader('Content-Type', 'application/json');
    }
}
