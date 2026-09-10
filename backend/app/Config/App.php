<?php

namespace Nirvona\Config;

/**
 * Application Configuration
 *
 * Global application settings.
 */
class App
{
    /**
     * Get application name
     *
     * @return string
     */
    public static function getName(): string
    {
        return $_ENV['APP_NAME'] ?? 'Nirvona';
    }

    /**
     * Get app environment
     *
     * @return string
     */
    public static function getEnvironment(): string
    {
        return $_ENV['APP_ENV'] ?? 'development';
    }

    /**
     * Check if in production
     *
     * @return bool
     */
    public static function isProduction(): bool
    {
        return self::getEnvironment() === 'production';
    }

    /**
     * Check if debug mode
     *
     * @return bool
     */
    public static function isDebug(): bool
    {
        return ($_ENV['APP_DEBUG'] ?? 'false') === 'true';
    }

    /**
     * Get JWT configuration
     *
     * @return array
     */
    public static function getJWT(): array
    {
        return [
            'secret' => $_ENV['JWT_SECRET'] ?? 'your-secret-key',
            'algorithm' => $_ENV['JWT_ALGORITHM'] ?? 'HS256',
            'expiration' => (int)($_ENV['JWT_EXPIRATION'] ?? 3600),
        ];
    }

    /**
     * Get frontend URL (for CORS)
     *
     * @return string
     */
    public static function getFrontendUrl(): string
    {
        return $_ENV['FRONTEND_URL'] ?? 'http://localhost:3000';
    }

    /**
     * Get backend URL
     *
     * @return string
     */
    public static function getBackendUrl(): string
    {
        return $_ENV['BACKEND_URL'] ?? 'http://localhost:8000';
    }

    /**
     * Get log channel
     *
     * @return string
     */
    public static function getLogChannel(): string
    {
        return $_ENV['LOG_CHANNEL'] ?? 'stack';
    }

    /**
     * Get log level
     *
     * @return string
     */
    public static function getLogLevel(): string
    {
        return $_ENV['LOG_LEVEL'] ?? 'debug';
    }

    /**
     * Get pagination page size
     *
     * @return int
     */
    public static function getPageSize(): int
    {
        return (int)($_ENV['PAGE_SIZE'] ?? 20);
    }

    /**
     * Get maximum page size
     *
     * @return int
     */
    public static function getMaxPageSize(): int
    {
        return (int)($_ENV['MAX_PAGE_SIZE'] ?? 100);
    }
}
