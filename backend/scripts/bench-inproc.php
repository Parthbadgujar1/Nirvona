<?php

/**
 * In-process throughput benchmark - measures the APPLICATION, not the web server.
 *
 *   php scripts/bench-inproc.php <path> [iterations=300] [token]
 *   php scripts/bench-inproc.php /api/students/me/dashboard 300 <jwt>
 *
 * Every iteration rebuilds the whole app (container, middleware, routes) and
 * handles one request - exactly what a PHP-FPM worker does per request - but
 * with the HTTP server taken out of the picture. The PHP dev server on Windows
 * adds ~15 ms of its own per request, which says nothing about production.
 * Database and Redis connections are reused between iterations, as they are
 * across requests inside a php-fpm worker (persistent connections).
 *
 * Run several copies at once (see scripts/bench-parallel.sh) to see how the
 * database and Redis behave when many workers hit them together.
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../app/bootstrap.php';

$path = '/' . ltrim($argv[1] ?? 'api/packages', '/');
$iterations = (int) ($argv[2] ?? 300);
$token = $argv[3] ?? null;

$_ENV['RATE_LIMIT_ENABLED'] = 'false';
$root = dirname(__DIR__);
$factory = new Slim\Psr7\Factory\ServerRequestFactory();

$times = [];
$statuses = [];
for ($i = 0; $i < $iterations + 10; $i++) {
    $t0 = hrtime(true);
    $app = nirvona_build_app($root);
    $request = $factory->createServerRequest('GET', 'http://localhost' . $path, ['REMOTE_ADDR' => '127.0.0.1']);
    if ($token) {
        $request = $request->withHeader('Authorization', 'Bearer ' . $token);
    }
    $response = $app->handle($request);
    (string) $response->getBody();
    $ms = (hrtime(true) - $t0) / 1e6;
    if ($i >= 10) { // first 10 warm opcache/autoload
        $times[] = $ms;
        $statuses[$response->getStatusCode()] = ($statuses[$response->getStatusCode()] ?? 0) + 1;
    }
}

sort($times);
$n = count($times);
printf(
    "%s  avg %.1f ms  p50 %.1f  p95 %.1f  p99 %.1f  => %.0f req/s per worker   status %s\n",
    str_pad($path, 42), array_sum($times) / $n, $times[(int) ($n * 0.5)], $times[(int) ($n * 0.95)],
    $times[(int) ($n * 0.99)], 1000 / (array_sum($times) / $n), json_encode($statuses)
);
