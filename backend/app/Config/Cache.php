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

        try {
            self::$redis = new RedisClient([
                'scheme' => 'tcp',
                'host' => $host,
                'port' => $port,
                'database' => $database,
            ]);

            // Test connection
            self::$redis->ping();
        } catch (\Exception $e) {
            throw new \RuntimeException("Redis connection failed: " . $e->getMessage());
        }

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
