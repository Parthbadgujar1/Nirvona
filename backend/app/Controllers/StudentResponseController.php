<?php

namespace Nirvona\Controllers;

use Nirvona\Services\StudentResponseService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * StudentResponseController
 *
 * Handles HTTP requests for student response-sheet upload & retrieval.
 */
class StudentResponseController
{
    private StudentResponseService $studentResponseService;

    public function __construct(StudentResponseService $studentResponseService)
    {
        $this->studentResponseService = $studentResponseService;
    }

    /**
     * GET /api/students/{id}/exams/{examId}/responses
     */
    public function getForStudent(Request $request, Response $response, array $args): Response
    {
        $result = $this->studentResponseService->getForStudent($args['examId'], $args['id']);
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/responses
     */
    public function listUploads(Request $request, Response $response): Response
    {
        $result = $this->studentResponseService->listUploads();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/exams/{examId}/responses
     */
    public function listByExam(Request $request, Response $response, array $args): Response
    {
        $result = $this->studentResponseService->getByExam($args['examId']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/exams/{examId}/responses
     *
     * Sits behind AuthMiddleware (see routes/api.php) - the student id
     * comes from the verified JWT, not the request body. This used to
     * accept an unauthenticated `studentId` straight from the client,
     * meaning anyone could submit (and later have evaluated) a response
     * sheet under any student's name.
     */
    public function upload(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $data['examId'] = $args['examId'];
        $data['studentId'] = $request->getAttribute('userId');
        $result = $this->studentResponseService->upload($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
}
