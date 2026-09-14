<?php

namespace Nirvona\Controllers;

use Nirvona\Services\ScoringService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * ScoringController
 *
 * Triggers the evaluation pipeline (StudentResponse + AnswerKey ->
 * Result + TopicPerformance + ResultAnalysis + Leaderboard). Admin only.
 */
class ScoringController
{
    private ScoringService $scoringService;

    public function __construct(ScoringService $scoringService)
    {
        $this->scoringService = $scoringService;
    }

    /**
     * POST /api/admin/exams/{examId}/students/{studentId}/evaluate
     */
    public function evaluateStudent(Request $request, Response $response, array $args): Response
    {
        $result = $this->scoringService->evaluateStudent($args['examId'], $args['studentId']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/evaluate
     *
     * Evaluates every uploaded response for the exam and rebuilds the
     * leaderboard once at the end.
     */
    public function evaluateExam(Request $request, Response $response, array $args): Response
    {
        $result = $this->scoringService->evaluateExam($args['examId']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/leaderboard/rebuild
     */
    public function rebuildLeaderboard(Request $request, Response $response, array $args): Response
    {
        $result = $this->scoringService->regenerateLeaderboard($args['examId']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
}
