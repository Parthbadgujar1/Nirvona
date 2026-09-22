<?php

namespace Nirvona\Controllers;

use Nirvona\Services\ExamCandidateService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * ExamCandidateController
 *
 * Handles HTTP requests for exam attendance & seat allocation.
 */
class ExamCandidateController
{
    private ExamCandidateService $examCandidateService;

    public function __construct(ExamCandidateService $examCandidateService)
    {
        $this->examCandidateService = $examCandidateService;
    }

    /**
     * GET /api/admin/exams/{examId}/candidates
     */
    public function listByExam(Request $request, Response $response, array $args): Response
    {
        $result = $this->examCandidateService->getByExam($args['examId']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/candidates
     */
    public function register(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $data['examId'] = $args['examId'];
        $result = $this->examCandidateService->register($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/candidates/register-enrolled
     */
    public function registerEnrolled(Request $request, Response $response, array $args): Response
    {
        $result = $this->examCandidateService->registerEnrolled($args['examId']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/admin/candidates/{id}/attendance
     */
    public function markAttendance(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->examCandidateService->markAttendance($args['id'], $data['attendance'] ?? '');
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/exams/{examId}/attendance-summary
     */
    public function attendanceSummary(Request $request, Response $response, array $args): Response
    {
        $result = $this->examCandidateService->getAttendanceSummary($args['examId']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
