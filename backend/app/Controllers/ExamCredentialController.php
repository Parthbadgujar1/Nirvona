<?php

namespace Nirvona\Controllers;

use Nirvona\Services\ExamCredentialService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * ExamCredentialController
 *
 * Handles HTTP requests for exam-hall CBT login credential issuance.
 */
class ExamCredentialController
{
    private ExamCredentialService $examCredentialService;

    public function __construct(ExamCredentialService $examCredentialService)
    {
        $this->examCredentialService = $examCredentialService;
    }

    /**
     * GET /api/admin/exams/{examId}/credentials
     */
    public function listByExam(Request $request, Response $response, array $args): Response
    {
        $result = $this->examCredentialService->getByExam($args['examId']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/students/{id}/exams/{examId}/credential
     */
    public function getForStudent(Request $request, Response $response, array $args): Response
    {
        $result = $this->examCredentialService->getForStudent($args['id'], $args['examId']);
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/credentials
     */
    public function assign(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $data['examId'] = $args['examId'];
        $result = $this->examCredentialService->assign($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/credentials/bulk
     */
    public function bulkAssign(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->examCredentialService->bulkAssign($args['examId'], $data['rows'] ?? []);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/credentials/{id}/revoke
     */
    public function revoke(Request $request, Response $response, array $args): Response
    {
        $result = $this->examCredentialService->revoke($args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
}
