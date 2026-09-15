<?php

/**
 * Run database migrations
 *
 * Tracks applied migrations in a schema_migrations table so this is
 * safe to run repeatedly - previously every run tried to re-execute
 * every migration file from scratch (no tracking at all), so running
 * it a second time against a database that already had tables always
 * failed on the first duplicate CREATE INDEX.
 */

require __DIR__ . '/vendor/autoload.php';

(new \Symfony\Component\Dotenv\Dotenv())->bootEnv(__DIR__ . '/.env');

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port = $_ENV['DB_PORT'] ?? '3306';
$database = $_ENV['DB_DATABASE'] ?? 'nirvona';
$username = $_ENV['DB_USERNAME'] ?? 'root';
$password = $_ENV['DB_PASSWORD'] ?? '';

$dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        // Every migration's up() runs a multi-statement string
        // (CREATE TABLE + CREATE INDEX...) through one exec() call -
        // PDO_MYSQL drops every statement after the first without this.
        PDO::MYSQL_ATTR_MULTI_STATEMENTS => true,
    ]);
    echo "Connected to MySQL\n";

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS schema_migrations (
            migration VARCHAR(255) PRIMARY KEY,
            appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ");

    $applied = $pdo->query("SELECT migration FROM schema_migrations")
        ->fetchAll(PDO::FETCH_COLUMN);
    $applied = array_flip($applied);

    $migrationsDir = __DIR__ . '/database/migrations';
    $files = glob($migrationsDir . '/*.php');
    sort($files);

    $ran = 0;
    $skipped = 0;

    foreach ($files as $file) {
        $name = basename($file);

        if (isset($applied[$name])) {
            echo "Skipping migration: {$name} (already applied)\n";
            $skipped++;
            continue;
        }

        $migration = require $file;

        echo "Running migration: {$name}... ";
        // No transaction wrapper: MySQL/InnoDB DDL (CREATE/ALTER/DROP
        // TABLE) causes an implicit commit, which would silently end a
        // beginTransaction() partway through and then throw "There is
        // no active transaction" on the later commit() - unlike
        // Postgres, DDL here just isn't transactional at all. Every
        // migration is written with IF NOT EXISTS/IF EXISTS guards (or,
        // for the few ALTER TABLE statements that can't use those in
        // MySQL, relies on schema_migrations tracking below) so a
        // migration is still safe to fix up and re-run after a partial
        // failure.
        try {
            $migration['up']($pdo);
            $stmt = $pdo->prepare("INSERT INTO schema_migrations (migration) VALUES (?)");
            $stmt->execute([$name]);
            echo "OK\n";
            $ran++;
        } catch (\Throwable $e) {
            throw $e;
        }
    }

    echo "\n{$ran} migration(s) applied, {$skipped} already up to date.\n";

    // Also run seeders if --seed flag provided
    if (isset($argc) && in_array('--seed', $argv)) {
        echo "\n╔═══════════════════════════════════════╗\n";
        echo "║        Running Seeders...            ║\n";
        echo "╚═══════════════════════════════════════╝\n";

        $seedersDir = __DIR__ . '/database/seeders';
        $seedFiles = glob($seedersDir . '/*.php');
        sort($seedFiles);

        $seedersRan = 0;
        foreach ($seedFiles as $file) {
            $name = basename($file);
            $seeder = require $file;

            echo "Running seeder: {$name}... ";
            $pdo->beginTransaction();
            try {
                if (isset($seeder['up'])) {
                    $seeder['up']($pdo);
                }
                $pdo->commit();
                echo "OK\n";
                $seedersRan++;
            } catch (\Throwable $e) {
                $pdo->rollBack();
                echo "FAILED\n";
                throw $e;
            }
        }

        echo "\n{$seedersRan} seeder(s) applied.\n";
    } else {
        echo "\n💡 To populate test data, run: php migrate.php --seed\n";
    }
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (\Throwable $e) {
    echo "Migration failed: " . get_class($e) . ": " . $e->getMessage() . "\n";
    exit(1);
}
