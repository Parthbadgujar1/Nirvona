#!/usr/bin/env php
<?php

/**
 * Nirvona Backend - Setup Verification Script
 *
 * Checks all prerequisites and configuration before running the application.
 * Run with: php verify-setup.php
 */

echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║       Nirvona Backend - Setup Verification Script         ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

$errors = [];
$warnings = [];
$success = [];

// 1. Check PHP Version
echo "1️⃣  PHP Version... ";
$phpVersion = phpversion();
if (version_compare($phpVersion, '8.2.0', '>=')) {
    echo "✅ OK (v{$phpVersion})\n";
    $success[] = "PHP version {$phpVersion}";
} else {
    echo "❌ FAILED\n";
    $errors[] = "PHP 8.2+ required, got {$phpVersion}";
}

// 2. Check Required PHP Extensions
echo "2️⃣  PHP Extensions... ";
$requiredExtensions = ['pdo', 'pdo_pgsql', 'redis', 'json', 'mbstring', 'curl'];
$missingExtensions = [];
foreach ($requiredExtensions as $ext) {
    if (!extension_loaded($ext)) {
        $missingExtensions[] = $ext;
    }
}

if (empty($missingExtensions)) {
    echo "✅ OK\n";
    $success[] = "All required extensions loaded";
} else {
    echo "❌ FAILED\n";
    $errors[] = "Missing extensions: " . implode(', ', $missingExtensions);
}

// 3. Check Composer
echo "3️⃣  Composer Dependencies... ";
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    echo "✅ OK\n";
    $success[] = "Composer dependencies installed";
} else {
    echo "❌ FAILED\n";
    $errors[] = "vendor/autoload.php not found - run 'composer install'";
}

// 4. Check .env file
echo "4️⃣  Environment Configuration... ";
if (file_exists(__DIR__ . '/.env')) {
    echo "✅ OK\n";
    $success[] = ".env file found";
} else {
    echo "⚠️  WARNING\n";
    $warnings[] = ".env file not found - copy from .env.example";
}

// 5. Check Storage Directories
echo "5️⃣  Storage Directories... ";
$storageOk = true;
if (!is_dir(__DIR__ . '/storage/logs')) {
    @mkdir(__DIR__ . '/storage/logs', 0755, true);
}
if (!is_dir(__DIR__ . '/storage/cache')) {
    @mkdir(__DIR__ . '/storage/cache', 0755, true);
}

if (is_writable(__DIR__ . '/storage/logs') && is_writable(__DIR__ . '/storage/cache')) {
    echo "✅ OK\n";
    $success[] = "Storage directories writable";
} else {
    echo "⚠️  WARNING\n";
    $warnings[] = "Storage directories may not be writable - run 'chmod -R 755 storage/'";
}

// 6. Check Database Connection (if .env exists)
echo "6️⃣  Database Connection... ";
if (file_exists(__DIR__ . '/.env')) {
    // Load .env
    $dotenv = file_get_contents(__DIR__ . '/.env');
    $lines = explode("\n", $dotenv);
    $env = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if (!empty($line) && strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $env[trim($key)] = trim($value);
        }
    }

    try {
        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s',
            $env['DB_HOST'] ?? 'localhost',
            $env['DB_PORT'] ?? 5432,
            $env['DB_DATABASE'] ?? 'nirvona'
        );
        $pdo = new PDO(
            $dsn,
            $env['DB_USERNAME'] ?? 'postgres',
            $env['DB_PASSWORD'] ?? 'secret'
        );
        echo "✅ OK\n";
        $success[] = "Database connection successful";
    } catch (PDOException $e) {
        echo "❌ FAILED\n";
        $errors[] = "Database connection failed: " . $e->getMessage();
    }
} else {
    echo "⏭️  SKIPPED\n";
    $warnings[] = ".env not configured - database check skipped";
}

// 7. Check Redis Connection (if available)
echo "7️⃣  Redis Connection... ";
if (function_exists('redis_connect') || class_exists('Redis')) {
    try {
        if (file_exists(__DIR__ . '/.env')) {
            $redis = new Redis();
            $redis->connect(
                $env['REDIS_HOST'] ?? 'localhost',
                $env['REDIS_PORT'] ?? 6379
            );
            if ($redis->ping()) {
                echo "✅ OK\n";
                $success[] = "Redis connection successful";
            }
        }
    } catch (Exception $e) {
        echo "⚠️  WARNING\n";
        $warnings[] = "Redis connection failed (may be OK if not needed): " . $e->getMessage();
    }
} else {
    echo "⚠️  WARNING\n";
    $warnings[] = "Redis extension not loaded (optional for local development)";
}

// 8. Check Key Files
echo "8️⃣  Key Files... ";
$requiredFiles = [
    'public/index.php',
    'app/Services/BaseService.php',
    'app/Repositories/StudentRepository.php',
    'routes/api.php',
    'composer.json',
    'phpunit.xml',
];

$missingFiles = [];
foreach ($requiredFiles as $file) {
    if (!file_exists(__DIR__ . '/' . $file)) {
        $missingFiles[] = $file;
    }
}

if (empty($missingFiles)) {
    echo "✅ OK\n";
    $success[] = "All key files present";
} else {
    echo "❌ FAILED\n";
    $errors[] = "Missing key files: " . implode(', ', $missingFiles);
}

// 9. Check Tests
echo "9️⃣  Test Setup... ";
if (file_exists(__DIR__ . '/tests/bootstrap.php') && file_exists(__DIR__ . '/phpunit.xml')) {
    echo "✅ OK\n";
    $success[] = "Test framework configured";
} else {
    echo "❌ FAILED\n";
    $errors[] = "Test configuration incomplete";
}

// 10. Check Docker Setup (optional)
echo "🔟 Docker Setup... ";
if (file_exists(__DIR__ . '/docker-compose.yml') && file_exists(__DIR__ . '/Dockerfile')) {
    echo "✅ OK (Optional)\n";
    $success[] = "Docker configuration available";
} else {
    echo "⚠️  SKIPPED\n";
    $warnings[] = "Docker setup not available (optional for local development)";
}

// Summary
echo "\n╔════════════════════════════════════════════════════════════╗\n";
echo "║                       SUMMARY                              ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

if (!empty($success)) {
    echo "✅ Passed (" . count($success) . "):\n";
    foreach ($success as $item) {
        echo "   • {$item}\n";
    }
    echo "\n";
}

if (!empty($warnings)) {
    echo "⚠️  Warnings (" . count($warnings) . "):\n";
    foreach ($warnings as $item) {
        echo "   • {$item}\n";
    }
    echo "\n";
}

if (!empty($errors)) {
    echo "❌ Errors (" . count($errors) . "):\n";
    foreach ($errors as $item) {
        echo "   • {$item}\n";
    }
    echo "\n";
    echo "🛠️  Please fix the errors above before running the application.\n";
    exit(1);
}

echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║  🎉 Setup verification passed! Ready to start developing.  ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

echo "Next steps:\n";
echo "  1. Run migrations: php -r \"require 'vendor/autoload.php';\"\n";
echo "  2. Start server: php -S localhost:8000 -t public/\n";
echo "  3. Or use Docker: docker-compose up -d\n";
echo "  4. Test health: curl http://localhost:8000/api/health\n";
echo "  5. Run tests: vendor/bin/phpunit\n\n";

echo "For more info, see SETUP.md\n";
exit(0);
