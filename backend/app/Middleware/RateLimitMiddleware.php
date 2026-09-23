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
 * Fixed-window rate limiting in Redis. Designed for a few hundred to a few
 * thousand real users, many of whom share one public IP (a coaching-centre
 * network, a hostel, mobile carrier NAT), so "per IP" alone would punish
 * innocent students:
 *
 *   - Every request:       a generous per-IP ceiling (flood protection) AND a
 *                          per-signed-in-user ceiling (keyed by the token, so
 *                          one student can't starve the rest of the network).
 *   - Login:               per-ACCOUNT attempts (stops password guessing against
 *                          one email no matter how many IPs it comes from) plus
 *                          a loose per-IP cap.
 *   - Register:            per-IP cap (stops mass account creation).
 *   - Starting a payment:  per-user cap.
 *
 * Counters are incremented atomically (one Lua call per counter) - the old
 * read-then-increment version let a burst of parallel requests slip past the
 * limit. If Redis is unavailable the limiter FAILS OPEN (the site keeps
 * working, unthrottled) rather than taking every endpoint down with it.
 */
class RateLimitMiddleware implements MiddlewareInterface
{
    private const INCR_LUA = "local n = redis.call('INCR', KEYS[1]) "
        . "if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end "
        . "return n";

    public function __construct(private readonly RedisClient $redis)
    {
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        if (
            strtolower($_ENV['RATE_LIMIT_ENABLED'] ?? 'true') === 'false'
            || $request->getMethod() === 'OPTIONS'
        ) {
            return $handler->handle($request);
        }

        try {
            $exceeded = $this->firstExceeded($this->buildChecks($request));
        } catch (\Throwable) {
            $exceeded = null; // fail open
        }

        if ($exceeded !== null) {
            return $this->rateLimitExceededResponse($exceeded['window']);
        }

        return $handler->handle($request);
    }

    /**
     * @return list<array{key: string, limit: int, window: int}>
     */
    private function buildChecks(Request $request): array
    {
        $ip = $this->getClientIp($request);
        $path = $request->getUri()->getPath();
        $method = $request->getMethod();
        $token = $this->bearerToken($request);
        // Hash: the raw token must never end up as a Redis key.
        $who = $token !== null ? 'u:' . substr(hash('sha256', $token), 0, 32) : 'ip:' . $ip;

        $checks = [
            ['key' => "rl:ip:{$ip}", 'limit' => $this->env('RATE_LIMIT_IP_PER_MIN', 1500), 'window' => 60],
        ];
        if ($token !== null) {
            $checks[] = ['key' => "rl:user:{$who}", 'limit' => $this->env('RATE_LIMIT_USER_PER_MIN', 300), 'window' => 60];
        }

        if ($method === 'POST' && str_ends_with($path, '/login')) {
            $email = $this->jsonField($request, 'email');
            if ($email !== null) {
                $checks[] = [
                    'key' => 'rl:login:acct:' . hash('sha256', strtolower($email)),
                    'limit' => $this->env('RATE_LIMIT_LOGIN_PER_ACCOUNT', 10),
                    'window' => 900,
                ];
            }
            $checks[] = ['key' => "rl:login:ip:{$ip}", 'limit' => $this->env('RATE_LIMIT_LOGIN_PER_IP', 120), 'window' => 60];
        } elseif ($method === 'POST' && str_ends_with($path, '/students/register')) {
            $checks[] = ['key' => "rl:register:{$ip}", 'limit' => $this->env('RATE_LIMIT_REGISTER_PER_IP', 30), 'window' => 3600];
        } elseif ($method === 'POST' && str_ends_with($path, '/payments/order')) {
            $checks[] = ['key' => "rl:payorder:{$who}", 'limit' => 10, 'window' => 60];
        } elseif ($method === 'POST' && str_ends_with($path, '/payments/quote')) {
            // Coupon codes are typed in by hand, so this endpoint is the one
            // place a code could be guessed. Limited per token AND per IP
            // (a fresh login mints a fresh token but not a fresh IP).
            $checks[] = ['key' => "rl:quote:{$who}", 'limit' => 20, 'window' => 60];
            $checks[] = ['key' => "rl:quote:ip:{$ip}", 'limit' => 40, 'window' => 600];
        } elseif ($method === 'POST' && str_ends_with($path, '/change-requests')) {
            $checks[] = ['key' => "rl:chgreq:{$who}", 'limit' => 10, 'window' => 3600];
        }

        return $checks;
    }

    /**
     * @param list<array{key: string, limit: int, window: int}> $checks
     * @return ?array{key: string, limit: int, window: int}
     */
    private function firstExceeded(array $checks): ?array
    {
        $counts = $this->redis->pipeline(function ($pipe) use ($checks) {
            foreach ($checks as $check) {
                $pipe->eval(self::INCR_LUA, 1, $check['key'], (string) $check['window']);
            }
        });

        foreach ($checks as $i => $check) {
            if ((int) $counts[$i] > $check['limit']) {
                return $check;
            }
        }
        return null;
    }

    private function env(string $name, int $default): int
    {
        $value = $_ENV[$name] ?? null;
        return is_numeric($value) ? (int) $value : $default;
    }

    private function bearerToken(Request $request): ?string
    {
        $header = $request->getHeaderLine('Authorization');
        return str_starts_with($header, 'Bearer ') && strlen($header) > 20 ? substr($header, 7) : null;
    }

    private function jsonField(Request $request, string $field): ?string
    {
        $body = $request->getBody();
        $raw = (string) $body;
        if ($body->isSeekable()) {
            $body->rewind();
        }
        $data = json_decode($raw, true);
        $value = is_array($data) ? ($data[$field] ?? null) : null;
        return is_string($value) && $value !== '' ? mb_substr($value, 0, 254) : null;
    }

    /**
     * The real client IP. X-Forwarded-For is client-controlled, so it is only
     * believed when the TCP peer is one of our own reverse proxies
     * (TRUSTED_PROXIES); otherwise anybody could dodge every limit by sending
     * a different X-Forwarded-For on each request.
     */
    private function getClientIp(Request $request): string
    {
        $peer = $request->getServerParams()['REMOTE_ADDR'] ?? '0.0.0.0';
        $trusted = array_filter(array_map('trim', explode(',', $_ENV['TRUSTED_PROXIES'] ?? '')));

        if ($trusted === [] || !in_array($peer, $trusted, true)) {
            return $peer;
        }

        $forwarded = array_map('trim', explode(',', $request->getHeaderLine('X-Forwarded-For')));
        // Walk from the right: skip our own proxies, the first other hop is the client.
        for ($i = count($forwarded) - 1; $i >= 0; $i--) {
            if ($forwarded[$i] !== '' && !in_array($forwarded[$i], $trusted, true)) {
                return filter_var($forwarded[$i], FILTER_VALIDATE_IP) ? $forwarded[$i] : $peer;
            }
        }
        return $peer;
    }

    private function rateLimitExceededResponse(int $retryAfter): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => [
                'code' => 'RATE_LIMIT_EXCEEDED',
                'message' => 'Too many requests. Please wait a moment and try again.',
            ],
        ]));
        return $response
            ->withStatus(429)
            ->withHeader('Content-Type', 'application/json')
            ->withHeader('Retry-After', (string) min($retryAfter, 60));
    }
}
