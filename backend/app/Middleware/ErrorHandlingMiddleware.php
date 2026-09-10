<?php

namespace Nirvona\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Log\LoggerInterface;

/**
 * ErrorHandlingMiddleware
 *
 * Catches exceptions and returns proper error responses.
 * Prevents stack traces from being exposed to clients.
 */
class ErrorHandlingMiddleware implements MiddlewareInterface
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        try {
            return $handler->handle($request);
        } catch (\Exception $e) {
            // Log the error
            $this->logger->error('Request error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'method' => $request->getMethod(),
                'path' => $request->getUri()->getPath(),
            ]);

            // Return safe error response (no stack trace)
            return $this->errorResponse($e);
        }
    }

    /**
     * Build error response
     *
     * @param \Exception $e
     * @return Response
     */
    private function errorResponse(\Exception $e): Response
    {
        $response = new \Slim\Psr7\Response();

        $statusCode = 500;
        $error = [
            'code' => 'INTERNAL_SERVER_ERROR',
            'message' => 'An internal server error occurred.',
        ];

        // Use different message for specific exceptions
        if ($e instanceof \InvalidArgumentException) {
            $statusCode = 400;
            $error['code'] = 'INVALID_REQUEST';
            $error['message'] = $e->getMessage();
        } elseif ($e instanceof \RuntimeException) {
            $statusCode = 500;
            $error['code'] = 'SERVICE_ERROR';
            $error['message'] = $e->getMessage();
        }

        $body = [
            'success' => false,
            'error' => $error,
        ];

        $response->getBody()->write(json_encode($body));
        return $response
            ->withStatus($statusCode)
            ->withHeader('Content-Type', 'application/json');
    }
}
