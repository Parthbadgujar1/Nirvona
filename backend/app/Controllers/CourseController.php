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
}
