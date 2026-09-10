<?php

namespace Nirvona\Controllers;

use Nirvona\Services\StudentService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * StudentController
 *
 * Handles HTTP requests for student operations.
 * Delegates business logic to StudentService.
 */
class StudentController
{
    private StudentService $studentService;

    public function __construct(StudentService $studentService)
    {
        $this->studentService = $studentService;
    }

    /**
     * POST /api/students/register
     *
     * @param Request $request
     * @param Response $response
     * @return Response
     */
    public function register(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody(), true);
        $result = $this->studentService->registerStudent($data);

        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response
            ->withStatus($statusCode)
            ->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/students/{id}
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getProfile(Request $request, Response $response, array $args): Response
    {
        $studentId = $args['id'];
        $result = $this->studentService->getStudent($studentId);

        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response
            ->withStatus($statusCode)
            ->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/students/{id}
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function updateProfile(Request $request, Response $response, array $args): Response
    {
        $studentId = $args['id'];
        $data = json_decode($request->getBody(), true);
        $result = $this->studentService->updateProfile($studentId, $data);

        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response
            ->withStatus($statusCode)
            ->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/students/{id}/enrollments
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getEnrollments(Request $request, Response $response, array $args): Response
    {
        $studentId = $args['id'];
        $result = $this->studentService->getEnrollments($studentId);

        $response->getBody()->write(json_encode($result));
        return $response
            ->withStatus(200)
            ->withHeader('Content-Type', 'application/json');
    }
}
