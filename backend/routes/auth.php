<?php

use Slim\App;
use Nirvona\Controllers\AuthController;
use Nirvona\Middleware\AuthMiddleware;

/**
 * Auth Routes
 *
 * Login (student + admin) and the current-user lookup. Student
 * registration is still POST /api/students/register (see routes/api.php) -
 * it now also returns a token on success.
 */
return function (App $app) {
    $app->post('/api/auth/login', [AuthController::class, 'loginStudent']);
    $app->post('/api/auth/admin/login', [AuthController::class, 'loginAdmin']);

    $meGroup = $app->group('/api/auth', function ($group) {
        $group->get('/me', [AuthController::class, 'me']);
    });
    $meGroup->add(AuthMiddleware::class);
};
