<?php

namespace Nirvona\Controllers;

use Nirvona\Services\EnrollmentService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * EnrollmentController
 *
 * Handles HTTP requests for course enrollments.
 */
class EnrollmentController
{
    private EnrollmentService $enrollmentService;

    public function __construct(EnrollmentService $enrollmentService)
    {
        $this->enrollmentService = $enrollmentService;
    }

    /**
     * POST /api/enrollments
     */
    public function create(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody(), true);
        $result = $this->enrollmentService->enroll($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/students/{id}/enrollments
     *
     * Note: StudentController::getEnrollments also serves this route via
     * StudentRepository's join - this is the equivalent entry point
     * through the Enrollment domain for callers that only need
     * enrollments, not the wider Student aggregate.
     */
    public function getByStudent(Request $request, Response $response, array $args): Response
    {
        $result = $this->enrollmentService->getByStudent($args['id']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/enrollments
     */
    public function listAll(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $page = max(1, (int) ($params['page'] ?? 1));
        $pageSize = min(100, max(1, (int) ($params['pageSize'] ?? 20)));

        $result = $this->enrollmentService->listAll($page, $pageSize);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
