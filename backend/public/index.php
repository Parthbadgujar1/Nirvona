<?php

/**
 * Nirvona Backend - Entry Point
 *
 * Initialize Slim application and register middleware and routes.
 */

use Slim\Factory\AppFactory;
use Slim\Middleware\ErrorMiddleware;
use Nirvona\Middleware\{
    CORSMiddleware,
    AuthMiddleware,
    ValidationMiddleware,
    RateLimitMiddleware,
    ErrorHandlingMiddleware
};
use Nirvona\Config\{Database, Cache, App};
use Monolog\Logger;
use Monolog\Handlers\StreamHandler;

// Load environment variables
$dotenv = \Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Initialize logger
$logger = new Logger('nirvona');
$logger->pushHandler(new StreamHandler(__DIR__ . '/../storage/logs/app.log'));

// Create app
$app = AppFactory::create();

// Register middleware (order matters - processes top to bottom)
$app->add(new ErrorHandlingMiddleware($logger));
$app->add(new ValidationMiddleware());
$app->add(new RateLimitMiddleware(Cache::getRedis()));
$app->add(new CORSMiddleware());

// Optionally add auth middleware for protected routes
// $app->add(new AuthMiddleware());

// Load routes
$apiRoutes = require __DIR__ . '/../routes/api.php';
$apiRoutes($app);

$adminRoutes = require __DIR__ . '/../routes/admin.php';
$adminRoutes($app);

$studentRoutes = require __DIR__ . '/../routes/student.php';
$studentRoutes($app);

// Run app
try {
    $app->run();
} catch (\Exception $e) {
    $logger->critical("Application error", [
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
    ]);

    // Close connections
    Database::closeConnection();
    Cache::closeConnection();

    throw $e;
}
