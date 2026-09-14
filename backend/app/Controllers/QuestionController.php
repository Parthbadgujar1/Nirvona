<?php

namespace Nirvona\Controllers;

use Nirvona\Services\QuestionService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * QuestionController
 *
 * Handles HTTP requests for exam question-bank authoring (admin only).
 */
class QuestionController
{
    private QuestionService $questionService;

    public function __construct(QuestionService $questionService)
    {
        $this->questionService = $questionService;
    }

    /**
     * GET /api/admin/exams/{examId}/questions
     */
    public function listByExam(Request $request, Response $response, array $args): Response
    {
        $subject = $request->getQueryParams()['subject'] ?? null;
        $result = $this->questionService->getByExam($args['examId'], $subject);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/questions
     */
    public function create(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $data['examId'] = $args['examId'];
        $result = $this->questionService->create($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/questions/bulk
     */
    public function bulkImport(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->questionService->bulkImport($args['examId'], $data['questions'] ?? []);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/admin/questions/{id}
     */
    public function update(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->questionService->update($args['id'], $data);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/admin/questions/{id}
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $result = $this->questionService->delete($args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
}
