<?php

/**
 * Builds the fully wired Slim application (container, middleware, routes).
 *
 * Kept out of public/index.php so the exact same app can be constructed by the
 * front controller, by scripts/bench-inproc.php (throughput measurement) and
 * by tests, without going through a web server.
 */

use Slim\App as SlimApp;
use Slim\Factory\AppFactory;
use Nirvona\Middleware\{
    CORSMiddleware,
    ValidationMiddleware,
    RateLimitMiddleware,
    ErrorHandlingMiddleware,
    SecurityHeadersMiddleware
};
use Nirvona\Config\{Container, Database, Cache, App};
use Nirvona\Integrations\PhonePeClient;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use Predis\Client as RedisClient;
use Psr\Log\LoggerInterface;

function nirvona_build_app(string $root): SlimApp
{
    // Composer autoloader.
    require_once $root . '/vendor/autoload.php';

    // Load environment variables
    $dotenv = new \Symfony\Component\Dotenv\Dotenv();
    $dotenv->bootEnv($root . '/.env');

    // Initialize logger
    $logger = new Logger('nirvona');
    $logger->pushHandler(new StreamHandler($root . '/storage/logs/app.log'));

    // Never advertise the PHP version.
    header_remove('X-Powered-By');

    // Wire the DI container: Controllers -> Services -> Repositories all get
    // autowired from these concrete singletons (see Container::autowire).
    $container = new Container();
    $container->set(PDO::class, Database::getConnection());
    $container->set(RedisClient::class, Cache::getRedis());
    $container->set(LoggerInterface::class, $logger);

    // PhonePeClient takes scalar constructor args (client id/secret), which
    // the autowiring container can't infer from a type hint alone - it has
    // to be constructed explicitly, same as PDO/Redis above.
    $phonePeConfig = App::getPhonePe();
    $container->set(PhonePeClient::class, new PhonePeClient(
        $phonePeConfig['clientId'],
        $phonePeConfig['clientSecret'],
        $phonePeConfig['clientVersion'],
        $phonePeConfig['environment'],
        Cache::getRedis(),
        $phonePeConfig['apiBase'],
        $phonePeConfig['authBase'],
    ));

    AppFactory::setContainer($container);
    $app = AppFactory::create();

    // Register middleware (order matters - the last one added runs first)
    $app->add(new ErrorHandlingMiddleware($logger));
    $app->add(new ValidationMiddleware());
    $app->add(new RateLimitMiddleware(Cache::getRedis()));
    $app->add(new CORSMiddleware());
    // Outermost: hardening headers + body-size cap apply to every response, including rejections.
    $app->add(new SecurityHeadersMiddleware());

    // Load routes. Auth is applied per route-group, not globally here:
    // - routes/admin.php wraps /api/admin/* in AdminMiddleware (JWT + role=admin)
    // - routes/student.php wraps /api/student(s)/* in AuthMiddleware (JWT, any role)
    // - routes/api.php and routes/auth.php stay public (catalogue, health,
    //   register/login) except /api/auth/me, which routes/auth.php protects itself
    //
    // routes/student.php MUST load before routes/api.php: it registers the
    // static route /api/students/me, and FastRoute (Slim's router) throws
    // "Static route is shadowed by previously defined variable route" if a
    // static path is registered after a variable one that could also match
    // it - static routes have to come first.
    foreach (['student', 'api', 'auth', 'admin'] as $routeFile) {
        $register = require $root . "/routes/{$routeFile}.php";
        $register($app);
    }

    return $app;
}
