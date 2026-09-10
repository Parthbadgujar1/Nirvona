<?php

use Slim\App;
use Nirvona\Controllers\{StudentController, ExamController, PaymentController, ResultController};

/**
 * API Routes
 *
 * Core API endpoints for students, exams, payments, and results.
 */
return function (App $app) {
    // Health check
    $app->get('/api/health', function ($request, $response) {
        $response->getBody()->write(json_encode(['status' => 'ok']));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // Student Routes
    $app->post('/api/students/register', [StudentController::class, 'register']);
    $app->get('/api/students/{id}', [StudentController::class, 'getProfile']);
    $app->put('/api/students/{id}', [StudentController::class, 'updateProfile']);
    $app->get('/api/students/{id}/enrollments', [StudentController::class, 'getEnrollments']);

    // Exam Routes
    $app->get('/api/exams', [ExamController::class, 'list']);
    $app->post('/api/exams', [ExamController::class, 'create']);
    $app->get('/api/exams/{id}', [ExamController::class, 'get']);
    $app->get('/api/exams/{id}/stats', [ExamController::class, 'getStats']);

    // Payment Routes
    $app->post('/api/payments', [PaymentController::class, 'process']);
    $app->get('/api/payments/{id}', [PaymentController::class, 'get']);
    $app->post('/api/payments/{id}/verify', [PaymentController::class, 'verify']);
    $app->get('/api/students/{id}/payments', [PaymentController::class, 'getStudentPayments']);

    // Result Routes
    $app->get('/api/results/{id}', [ResultController::class, 'get']);
    $app->get('/api/students/{id}/results', [ResultController::class, 'getStudentResults']);
    $app->get('/api/exams/{examId}/leaderboard', [ResultController::class, 'getLeaderboard']);
    $app->get('/api/students/{id}/analytics', [ResultController::class, 'getAnalytics']);
    $app->post('/api/results', [ResultController::class, 'create']);
};
