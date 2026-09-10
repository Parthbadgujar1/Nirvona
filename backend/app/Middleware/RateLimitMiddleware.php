<?php

namespace Nirvona\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Predis\Client as RedisClient;

/**
 * RateLimitMiddleware
 *
 * Implements rate limiting to prevent abuse.
 * Different limits for different endpoints.
 */
class RateLimitMiddleware implements MiddlewareInterface
{
    private RedisClient $redis;

    // Rate limits: [requests, minutes]
    private array $limits = [
        'login' => [5, 1],           // 5 requests per minute
        'payment' => [10, 1],        // 10 requests per minute
        'default' => [1000, 60],     // 1000 requests per hour
    ];

    public function __construct(RedisClient $redis)
    {
        $this->redis = $redis;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $clientIp = $this->getClientIp($request);
        $endpoint = $this->getEndpoint($request);
        $limit = $this->getLimitForEndpoint($endpoint);

        // Build rate limit key
        $key = "rate_limit:{$clientIp}:{$endpoint}";
        $limitKey = "rate_limit_limit:{$clientIp}:{$endpoint}";

        // Get current request count
        $count = $this->redis->get($key);
        $count = $count ? (int)$count : 0;

        // Check if limit exceeded
        if ($count >= $limit[0]) {
            return $this->rateLimitExceededResponse();
        }

        // Increment counter
        $this->redis->incr($key);
        $this->redis->expire($key, $limit[1] * 60);

        // Add rate limit headers to response
        $response = $handler->handle($request);
        return $response
            ->withHeader('X-RateLimit-Limit', (string)$limit[0])
            ->withHeader('X-RateLimit-Remaining', (string)($limit[0] - $count - 1))
            ->withHeader('X-RateLimit-Reset', (string)(time() + ($limit[1] * 60)));
    }

    /**
     * Get client IP address
     *
     * @param Request $request
     * @return string
     */
    private function getClientIp(Request $request): string
    {
        $ip = $request->getServerParams()['REMOTE_ADDR'] ?? '0.0.0.0';

        // Check for proxied IP
        $xForwardedFor = $request->getHeaderLine('X-Forwarded-For');
        if ($xForwardedFor) {
            $ips = explode(',', $xForwardedFor);
            $ip = trim($ips[0]);
        }

        return $ip;
    }

    /**
     * Get endpoint from request
     *
     * @param Request $request
     * @return string
     */
    private function getEndpoint(Request $request): string
    {
        $path = $request->getUri()->getPath();

        if (strpos($path, '/login') !== false) {
            return 'login';
        }
        if (strpos($path, '/payments') !== false) {
            return 'payment';
        }

        return 'default';
    }

    /**
     * Get rate limit for endpoint
     *
     * @param string $endpoint
     * @return array [requests, minutes]
     */
    private function getLimitForEndpoint(string $endpoint): array
    {
        return $this->limits[$endpoint] ?? $this->limits['default'];
    }

    /**
     * Return rate limit exceeded response
     *
     * @return Response
     */
    private function rateLimitExceededResponse(): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => [
                'code' => 'RATE_LIMIT_EXCEEDED',
                'message' => 'Too many requests. Please try again later.',
            ],
        ]));
        return $response->withStatus(429)->withHeader('Content-Type', 'application/json');
    }
}
