<?php

namespace Nirvona\Controllers;

use Nirvona\Services\ExamCentreService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * ExamCentreController
 *
 * Handles HTTP requests for exam centre management.
 */
class ExamCentreController
{
    private ExamCentreService $examCentreService;

    public function __construct(ExamCentreService $examCentreService)
    {
        $this->examCentreService = $examCentreService;
    }

    /**
     * GET /api/admin/exam-centres
     */
    public function list(Request $request, Response $response): Response
    {
        $result = $this->examCentreService->list();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/exam-centres/{id}
     */
    public function get(Request $request, Response $response, array $args): Response
    {
        $result = $this->examCentreService->get($args['id']);
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exam-centres
     */
    public function create(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody(), true);
        $result = $this->examCentreService->create($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
}
