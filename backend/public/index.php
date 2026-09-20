<?php

/**
 * Nirvona Backend - Entry Point
 *
 * The app itself is assembled in app/bootstrap.php.
 */

require __DIR__ . '/../app/bootstrap.php';

$app = nirvona_build_app(dirname(__DIR__));

try {
    $app->run();
} catch (\Exception $e) {
    // Nothing above should escape ErrorHandlingMiddleware, but if it does the
    // client must still get a clean failure and the detail must be logged.
    $logger = new \Monolog\Logger('nirvona');
    $logger->pushHandler(new \Monolog\Handler\StreamHandler(dirname(__DIR__) . '/storage/logs/app.log'));
    $logger->critical('Application error', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

    \Nirvona\Config\Database::closeConnection();
    \Nirvona\Config\Cache::closeConnection();

    throw $e;
}
