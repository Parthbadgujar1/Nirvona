<?php

namespace Nirvona\Config;

use Predis\Client as RedisClient;

/**
 * Cache Configuration
 *
 * Provides Redis connection for caching and sessions.
 */
class Cache
{
    private static ?RedisClient $redis = null;

    /**
     * Get Redis connection
     *
     * @return RedisClient
     */
    public static function getRedis(): RedisClient
    {
        if (self::$redis !== null) {
            return self::$redis;
        }

        $host = $_ENV['REDIS_HOST'] ?? 'localhost';
        $port = $_ENV['REDIS_PORT'] ?? 6379;
        $database = $_ENV['REDIS_DATABASE'] ?? 0;

        // Predis connects lazily (on the first command), so building the
        // client costs nothing and a dead Redis no longer takes the whole API
        // down at boot. Short timeouts keep a dead Redis from stalling every
        // request - callers treat Redis as an optimisation and fail open.
        // 127.0.0.1 rather than "localhost": on Windows "localhost" tries IPv6
        // first and waits ~2s before falling back, on every request.
        self::$redis = new RedisClient([
            'scheme' => 'tcp',
            'host' => $host,
            'port' => $port,
            'database' => $database,
            'timeout' => 0.5,
            'read_write_timeout' => 1.0,
            // Reuse the TCP connection across requests within a PHP worker.
            'persistent' => true,
        ]);

        return self::$redis;
    }

    /**
     * Get cache TTL values
     *
     * @return array
     */
    public static function getTTL(): array
    {
        return [
            'session' => 3600,           // 1 hour
            'query' => 1800,             // 30 minutes
            'leaderboard' => 3600,       // 1 hour
            'short' => 300,              // 5 minutes
        ];
    }

    /**
     * Close Redis connection
     *
     * @return void
     */
    public static function closeConnection(): void
    {
        if (self::$redis !== null) {
            self::$redis->disconnect();
            self::$redis = null;
        }
    }
}
