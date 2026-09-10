<?php

use Slim\App;
use Nirvona\Controllers\AdminController;

/**
 * Admin Routes
 *
 * Admin dashboard and management endpoints.
 * Requires admin authentication.
 */
return function (App $app) {
    // Admin Dashboard
    $app->get('/api/admin/dashboard', [AdminController::class, 'getDashboard']);

    // Student Management
    $app->get('/api/admin/students', [AdminController::class, 'listStudents']);

    // Payment Management
    $app->get('/api/admin/payments', [AdminController::class, 'listPayments']);

    // Exam Management
    $app->get('/api/admin/exams', [AdminController::class, 'listExams']);
    $app->post('/api/admin/exams', [AdminController::class, 'createExam']);

    // Reports
    $app->get('/api/admin/reports', [AdminController::class, 'getReports']);

    // Analytics
    $app->get('/api/admin/analytics', [AdminController::class, 'getAnalytics']);
};
