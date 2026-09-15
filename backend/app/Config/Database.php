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

        $host = $_ENV['DB_HOST'] ?? '127.0.0.1';
        $port = $_ENV['DB_PORT'] ?? '3306';
        $database = $_ENV['DB_DATABASE'] ?? 'nirvona';
        $username = $_ENV['DB_USERNAME'] ?? 'root';
        $password = $_ENV['DB_PASSWORD'] ?? '';

        // utf8mb4 (not plain utf8, which MySQL caps at 3 bytes/char and
        // can't hold the full Unicode range - e.g. emoji in a student's
        // name or notification text would silently fail to insert).
        $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";

        try {
            self::$connection = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                // Real MySQL types (INT stays an int, not a string) -
                // without this every PDO_MYSQL column comes back as a
                // string same as PDO_PGSQL did, which is exactly the
                // failure mode ColumnCase::NUMERIC_FIELDS already works
                // around for DECIMAL columns; this at least stops it
                // from *also* applying to plain integers.
                PDO::ATTR_STRINGIFY_FETCHES => false,
                // Every migration's up()/down() runs one multi-statement
                // string through a single $pdo->exec() call (CREATE TABLE
                // followed by CREATE INDEX statements). PDO_PGSQL always
                // allowed that; PDO_MYSQL silently executes only the
                // first statement and drops the rest unless this is on.
                PDO::MYSQL_ATTR_MULTI_STATEMENTS => true,
            ]);

            // MySQL's session time_zone defaults to 'SYSTEM' - whatever
            // the OS the server runs on is set to - while every
            // explicit timestamp this app writes (StudentService's
            // enrolledAt, JWT iat/exp, audit log entries, ...) is
            // PHP's date()/time(), always UTC (date_default_timezone
            // is never set, so PHP's own default applies). Left
            // unpinned, CURRENT_TIMESTAMP-defaulted columns
            // (createdAt/updatedAt) silently disagree with PHP-set
            // columns by the server's UTC offset - on this dev machine
            // (IST) a student's createdAt and enrolledAt landed 5.5
            // hours apart despite being set in the same request.
            self::$connection->exec("SET time_zone = '+00:00'");
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
