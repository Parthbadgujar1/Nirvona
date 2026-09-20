<?php

namespace Nirvona\Config;

use PDO;

/**
 * Database Configuration
 *
 * Provides database connection and configuration.
 */
class Database
{
    private static ?PDO $connection = null;

    /**
     * Get database connection
     *
     * @return PDO
     */
    public static function getConnection(): PDO
    {
        if (self::$connection !== null) {
            return self::$connection;
        }

        $host = $_ENV['DB_HOST'] ?? 'localhost';
        $port = $_ENV['DB_PORT'] ?? '5432';
        $database = $_ENV['DB_DATABASE'] ?? 'nirvona';
        $username = $_ENV['DB_USERNAME'] ?? 'postgres';
        $password = $_ENV['DB_PASSWORD'] ?? '';
        $sslMode = $_ENV['DB_SSLMODE'] ?? 'prefer';

        $dsn = "pgsql:host={$host};port={$port};dbname={$database};sslmode={$sslMode}";

        try {
            self::$connection = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                // Opening a Postgres connection costs 30-55 ms (auth handshake) -
                // more than the rest of a typical request. A persistent connection
                // is kept by the PHP worker and reused by the next request (~3 ms),
                // and PDO rolls back any transaction left open at request end.
                // Set DB_PERSISTENT=false to opt out (e.g. behind some poolers).
                PDO::ATTR_PERSISTENT => filter_var($_ENV['DB_PERSISTENT'] ?? 'true', FILTER_VALIDATE_BOOLEAN),
            ]);
        } catch (\PDOException $e) {
            throw new \RuntimeException("Database connection failed: " . $e->getMessage());
        }

        return self::$connection;
    }

    /**
     * Close connection
     *
     * @return void
     */
    public static function closeConnection(): void
    {
        self::$connection = null;
    }
}
