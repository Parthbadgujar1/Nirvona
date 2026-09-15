<?php

namespace Nirvona\Controllers;

use Nirvona\Services\AdmitCardService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * AdmitCardController
 *
 * Handles HTTP requests for admit card generation & publishing.
 */
class AdmitCardController
{
    private AdmitCardService $admitCardService;

    public function __construct(AdmitCardService $admitCardService)
    {
        $this->admitCardService = $admitCardService;
    }

    /**
     * GET /api/admin/exams/{examId}/admit-cards
     */
    public function listByExam(Request $request, Response $response, array $args): Response
    {
        $result = $this->admitCardService->getByExam($args['examId']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/students/{id}/admit-cards
     */
    public function listByStudent(Request $request, Response $response, array $args): Response
    {
        $result = $this->admitCardService->getByStudent($args['id']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/student/admit-cards
     *
     * Replaces the always-empty inline stub previously registered
     * directly in routes/student.php. Sits behind AuthMiddleware (see
     * routes/student.php), so the student id comes from the verified
     * JWT, never from client input.
     */
    public function listForCurrentStudent(Request $request, Response $response): Response
    {
        $studentId = $request->getAttribute('userId');
        $result = $this->admitCardService->getByStudent($studentId);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/students/me/admit-card (singular - the frontend expects
     * one current admit card, not a list)
     */
    public function getLatestForStudent(Request $request, Response $response, array $args): Response
    {
        $result = $this->admitCardService->getLatestForStudent($args['id']);
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/admit-cards
     */
    public function generate(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $data['examId'] = $args['examId'];
        $result = $this->admitCardService->generate($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/admit-cards/{id}/publish
     */
    public function publish(Request $request, Response $response, array $args): Response
    {
        $result = $this->admitCardService->publish($args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/admit-cards/{id}/revoke
     */
    public function revoke(Request $request, Response $response, array $args): Response
    {
        $result = $this->admitCardService->revoke($args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/admit-cards/generate-all
     *
     * Bulk-generates an admit card for every candidate registered for
     * the exam who doesn't already have one.
     */
    public function generateAll(Request $request, Response $response, array $args): Response
    {
        $result = $this->admitCardService->generateForExam($args['examId']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams/{examId}/admit-cards/publish-all
     *
     * Bulk-publishes every generated (not yet published) admit card
     * for the exam.
     */
    public function publishAll(Request $request, Response $response, array $args): Response
    {
        $result = $this->admitCardService->publishForExam($args['examId']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
}
