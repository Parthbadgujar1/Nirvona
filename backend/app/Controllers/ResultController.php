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
        // A result belongs to one student: anyone else (even signed in) gets
        // the same "not found" as a missing id, so ids can't be probed.
        if (
            $result['success']
            && $request->getAttribute('role') !== 'admin'
            && ($result['data']['studentId'] ?? null) !== $request->getAttribute('userId')
        ) {
            $result = ['success' => false, 'error' => 'Unable to fetch result'];
        }
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/students/me/exams/{examId}/result
     *
     * The real endpoint behind every "View result" link in the app -
     * they all navigate with an examId, not a result's own id, which
     * is what GET /api/results/{id} (above) actually looks up.
     */
    public function getForCurrentStudentExam(Request $request, Response $response, array $args): Response
    {
        $result = $this->resultService->getForStudentExam($args['id'], $args['examId']);
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
     * GET /api/students/me/results/latest
     */
    public function getLatestForStudent(Request $request, Response $response, array $args): Response
    {
        $result = $this->resultService->getLatestResult($args['id']);
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
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

    /**
     * GET /api/students/{id}/topic-performance
     */
    public function getTopicPerformance(Request $request, Response $response, array $args): Response
    {
        $courseSlug = $request->getQueryParams()['course'] ?? '';
        $result = $this->resultService->getTopicPerformance($args['id'], $courseSlug);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/exams/{examId}/results
     */
    public function listByExam(Request $request, Response $response, array $args): Response
    {
        $result = $this->resultService->getByExamForAdmin($args['examId']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/publish-results
     */
    public function publish(Request $request, Response $response, array $args): Response
    {
        $result = $this->resultService->publishExamResults($args['examId']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
}
