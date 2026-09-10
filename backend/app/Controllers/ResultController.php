<?php

namespace Nirvona\Controllers;

use Nirvona\Services\ResultService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * ResultController
 *
 * Handles HTTP requests for result operations.
 */
class ResultController
{
    private ResultService $resultService;

    public function __construct(ResultService $resultService)
    {
        $this->resultService = $resultService;
    }

    /**
     * GET /api/results/{id}
     */
    public function get(Request $request, Response $response, array $args): Response
    {
        $result = $this->resultService->getResult($args['id']);
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/results/student/{id}
     */
    public function getStudentResults(Request $request, Response $response, array $args): Response
    {
        $result = $this->resultService->getStudentResults($args['id']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/exams/{examId}/leaderboard
     */
    public function getLeaderboard(Request $request, Response $response, array $args): Response
    {
        $result = $this->resultService->getLeaderboard($args['examId']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/students/{id}/analytics
     */
    public function getAnalytics(Request $request, Response $response, array $args): Response
    {
        $courseSlug = $request->getQueryParams()['course'] ?? '';
        $result = $this->resultService->getPerformanceAnalytics($args['id'], $courseSlug);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/results
     */
    public function create(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody(), true);
        $result = $this->resultService->calculateResult($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
}
