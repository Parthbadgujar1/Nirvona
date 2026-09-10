<?php

namespace Nirvona\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * AdminController
 *
 * Handles HTTP requests for admin operations.
 */
class AdminController
{
    /**
     * GET /api/admin/dashboard
     */
    public function getDashboard(Request $request, Response $response): Response
    {
        $dashboard = [
            'success' => true,
            'data' => [
                'totalStudents' => 1250,
                'activeEnrollments' => 890,
                'successfulPurchases' => 1200,
                'revenue' => 450000,
                'upcomingExams' => 5,
                'pendingResults' => 34,
                'recentActivity' => [],
            ],
        ];
        $response->getBody()->write(json_encode($dashboard));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/students
     */
    public function listStudents(Request $request, Response $response): Response
    {
        $result = [
            'success' => true,
            'data' => [],
            'meta' => ['total' => 0, 'page' => 1, 'pageSize' => 20],
        ];
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/payments
     */
    public function listPayments(Request $request, Response $response): Response
    {
        $result = [
            'success' => true,
            'data' => [],
            'meta' => ['total' => 0, 'page' => 1, 'pageSize' => 20],
        ];
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/exams
     */
    public function listExams(Request $request, Response $response): Response
    {
        $result = [
            'success' => true,
            'data' => [],
            'meta' => ['total' => 0, 'page' => 1, 'pageSize' => 20],
        ];
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams
     */
    public function createExam(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody(), true);
        $result = [
            'success' => true,
            'data' => $data + ['id' => 'exam_' . uniqid()],
            'message' => 'Exam created successfully',
        ];
        $response->getBody()->write(json_encode($result));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }
}
