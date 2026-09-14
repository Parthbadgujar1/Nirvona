<?php

namespace Nirvona\Controllers;

use Nirvona\Services\AnswerKeyService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * AnswerKeyController
 *
 * Handles HTTP requests for exam answer keys.
 */
class AnswerKeyController
{
    private AnswerKeyService $answerKeyService;

    public function __construct(AnswerKeyService $answerKeyService)
    {
        $this->answerKeyService = $answerKeyService;
    }

    /**
     * GET /api/exams/{examId}/answer-key
     *
     * Student-facing: only returns a published key.
     */
    public function get(Request $request, Response $response, array $args): Response
    {
        $result = $this->answerKeyService->getForExam($args['examId'], false);
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/exams/{examId}/answer-key
     *
     * Admin-facing: returns the key regardless of publish status.
     */
    public function getForAdmin(Request $request, Response $response, array $args): Response
    {
        $result = $this->answerKeyService->getForExam($args['examId'], true);
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/answer-key
     */
    public function upload(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->answerKeyService->upload($args['examId'], $data['entries'] ?? []);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/answer-key/publish
     */
    public function publish(Request $request, Response $response, array $args): Response
    {
        $result = $this->answerKeyService->publish($args['examId']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/answer-key/unpublish
     */
    public function unpublish(Request $request, Response $response, array $args): Response
    {
        $result = $this->answerKeyService->unpublish($args['examId']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/answer-keys
     */
    public function listAll(Request $request, Response $response): Response
    {
        $result = $this->answerKeyService->listAll();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
