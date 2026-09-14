<?php

/**
 * Nirvona Backend - Entry Point
 *
 * Initialize Slim application and register middleware and routes.
 */

use Slim\Factory\AppFactory;
use Nirvona\Middleware\{
    CORSMiddleware,
    ValidationMiddleware,
    RateLimitMiddleware,
    ErrorHandlingMiddleware
};
use Nirvona\Config\{Container, Database, Cache, App};
use Nirvona\Integrations\RazorpayClient;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use Predis\Client as RedisClient;
use Psr\Log\LoggerInterface;

// Composer autoloader - this was missing entirely, meaning every
// request to the real entry point fatal-errored on the very first
// `use`d class before anything else in this file could run. Every
// smoke test up to now went through a script that required this
// manually, which is exactly how this stayed hidden.
require __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$dotenv = new \Symfony\Component\Dotenv\Dotenv();
$dotenv->bootEnv(__DIR__ . '/../.env');

// Initialize logger
$logger = new Logger('nirvona');
$logger->pushHandler(new StreamHandler(__DIR__ . '/../storage/logs/app.log'));

// Wire the DI container: Controllers -> Services -> Repositories all get
// autowired from these three concrete singletons (see Container::autowire).
$container = new Container();
$container->set(PDO::class, Database::getConnection());
$container->set(RedisClient::class, Cache::getRedis());
$container->set(LoggerInterface::class, $logger);

// RazorpayClient takes scalar constructor args (key id/secret), which
// the autowiring container can't infer from a type hint alone - it has
// to be constructed explicitly, same as PDO/Redis above.
$razorpayConfig = App::getRazorpay();
$container->set(RazorpayClient::class, new RazorpayClient(
    $razorpayConfig['keyId'],
    $razorpayConfig['keySecret'],
));

AppFactory::setContainer($container);
$app = AppFactory::create();

// Register middleware (order matters - processes top to bottom)
$app->add(new ErrorHandlingMiddleware($logger));
$app->add(new ValidationMiddleware());
$app->add(new RateLimitMiddleware(Cache::getRedis()));
$app->add(new CORSMiddleware());

// Load routes. Auth is applied per route-group, not globally here:
// - routes/admin.php wraps /api/admin/* in AdminMiddleware (JWT + role=admin)
// - routes/student.php wraps /api/student/* in AuthMiddleware (JWT, any role)
// - routes/api.php and routes/auth.php stay public (catalogue, health,
//   register/login) except /api/auth/me, which routes/auth.php protects itself
//
// routes/student.php MUST load before routes/api.php: it registers the
// static route /api/students/me, and FastRoute (Slim's router) throws
// "Static route is shadowed by previously defined variable route" if a
// static path is registered after a variable one that could also match
// it (api.php's /api/students/{id}) - static routes have to come first.
$studentRoutes = require __DIR__ . '/../routes/student.php';
$studentRoutes($app);

$apiRoutes = require __DIR__ . '/../routes/api.php';
$apiRoutes($app);

$authRoutes = require __DIR__ . '/../routes/auth.php';
$authRoutes($app);

$adminRoutes = require __DIR__ . '/../routes/admin.php';
$adminRoutes($app);

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
