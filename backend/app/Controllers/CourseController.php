<?php

namespace Nirvona\Controllers;

use Nirvona\Services\CourseService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * CourseController
 *
 * Handles HTTP requests for the course catalogue.
 */
class CourseController
{
    private CourseService $courseService;

    public function __construct(CourseService $courseService)
    {
        $this->courseService = $courseService;
    }

    /**
     * GET /api/courses
     */
    public function list(Request $request, Response $response): Response
    {
        $query = $request->getQueryParams()['q'] ?? null;
        $result = $query ? $this->courseService->search($query) : $this->courseService->listCourses();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/courses/{slug}
     */
    public function get(Request $request, Response $response, array $args): Response
    {
        $result = $this->courseService->getCourse($args['slug']);
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/courses/{slug}/packages
     */
    public function getPackages(Request $request, Response $response, array $args): Response
    {
        $result = $this->courseService->getPackagesForCourse($args['slug']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/courses
     */
    public function listForAdmin(Request $request, Response $response): Response
    {
        $result = $this->courseService->listAllForAdmin();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/courses
     */
    public function create(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->courseService->create($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/admin/courses/{slug}
     */
    public function update(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->courseService->update($args['slug'], $data);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/admin/courses/{slug}
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $result = $this->courseService->delete($args['slug']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
}
