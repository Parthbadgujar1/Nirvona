<?php

namespace Nirvona\Controllers;

use Nirvona\Services\ExamService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * ExamController
 *
 * Handles HTTP requests for exam operations.
 */
class ExamController
{
    private ExamService $examService;

    public function __construct(ExamService $examService)
    {
        $this->examService = $examService;
    }

    /**
     * GET /api/exams
     */
    public function list(Request $request, Response $response): Response
    {
        $result = $this->examService->getUpcomingExams();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/exams/{id}
     */
    public function get(Request $request, Response $response, array $args): Response
    {
        $result = $this->examService->getExam($args['id']);
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/exams
     */
    public function create(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody(), true);
        $result = $this->examService->scheduleExam($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/exams/{id}/stats
     */
    public function getStats(Request $request, Response $response, array $args): Response
    {
        $result = $this->examService->getExamStats($args['id']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
