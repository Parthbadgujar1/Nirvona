<?php

use Slim\App;
use Nirvona\Controllers\{StudentController, ExamController, ResultController};

/**
 * Student Routes
 *
 * Student-specific endpoints.
 * Requires student authentication.
 */
return function (App $app) {
    // Student Profile
    $app->get('/api/student/profile', [StudentController::class, 'getProfile']);
    $app->put('/api/student/profile', [StudentController::class, 'updateProfile']);

    // Student Enrollments
    $app->get('/api/student/enrollments', [StudentController::class, 'getEnrollments']);

    // Available Exams
    $app->get('/api/student/exams', [ExamController::class, 'list']);
    $app->get('/api/student/exams/{id}', [ExamController::class, 'get']);

    // Exam Results
    $app->get('/api/student/results', [ResultController::class, 'getStudentResults']);
    $app->get('/api/student/results/{id}', [ResultController::class, 'get']);
    $app->get('/api/student/analytics', [ResultController::class, 'getAnalytics']);

    // Admit Cards
    $app->get('/api/student/admit-cards', function ($request, $response) {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    });
};
