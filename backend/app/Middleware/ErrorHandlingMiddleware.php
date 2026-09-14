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
        } catch (\Throwable $e) {
            // \Throwable, not \Exception: a TypeError or other \Error thrown
            // deep in a controller/service/repository must still produce a
            // clean JSON error response instead of leaking a blank fatal
            // past this middleware to the client.
            //
            // Slim's own routing throws HttpSpecializedException (extends
            // \Exception) for an unmatched route or method - e.g. hitting
            // GET / with no such route, or POST on a GET-only route. Before
            // this was special-cased, every one of those came back as a
            // generic 500 INTERNAL_SERVER_ERROR instead of the intended
            // 404/405, which is what a client actually needs to tell "route
            // doesn't exist" apart from "server broke".
            if ($e instanceof \Slim\Exception\HttpSpecializedException) {
                $this->logger->info('Route error', [
                    'message' => $e->getMessage(),
                    'code' => $e->getCode(),
                    'method' => $request->getMethod(),
                    'path' => $request->getUri()->getPath(),
                ]);
                return $this->httpExceptionResponse($e);
            }

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
     * Build a response for a Slim routing exception, preserving its
     * intended status code (404, 405, ...) instead of always returning 500.
     *
     * @param \Slim\Exception\HttpSpecializedException $e
     * @return Response
     */
    private function httpExceptionResponse(\Slim\Exception\HttpSpecializedException $e): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => [
                'code' => 'ROUTE_ERROR',
                'message' => $e->getMessage(),
            ],
        ]));
        return $response
            ->withStatus($e->getCode())
            ->withHeader('Content-Type', 'application/json');
    }

    /**
     * Build error response
     *
     * @param \Throwable $e
     * @return Response
     */
    private function errorResponse(\Throwable $e): Response
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
