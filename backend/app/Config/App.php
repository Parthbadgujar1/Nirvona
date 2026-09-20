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
     * Get PhonePe payment gateway configuration
     *
     * Credentials come from the PhonePe Business dashboard
     * (Developer Settings). `environment` is "sandbox" for testing
     * (default) or "production" for live payments. The two base-url
     * overrides exist only so tests can point at a stub server.
     *
     * @return array{clientId: string, clientSecret: string, clientVersion: string, environment: string, apiBase: ?string, authBase: ?string}
     */
    public static function getPhonePe(): array
    {
        return [
            'clientId' => $_ENV['PHONEPE_CLIENT_ID'] ?? '',
            'clientSecret' => $_ENV['PHONEPE_CLIENT_SECRET'] ?? '',
            'clientVersion' => $_ENV['PHONEPE_CLIENT_VERSION'] ?? '1',
            'environment' => $_ENV['PHONEPE_ENV'] ?? 'sandbox',
            'apiBase' => ($_ENV['PHONEPE_API_BASE'] ?? '') ?: null,
            'authBase' => ($_ENV['PHONEPE_AUTH_BASE'] ?? '') ?: null,
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
