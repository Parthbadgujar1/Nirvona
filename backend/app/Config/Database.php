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
