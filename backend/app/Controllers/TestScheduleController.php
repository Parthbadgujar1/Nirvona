<?php

namespace Nirvona\Controllers;

use Nirvona\Services\TestScheduleService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * TestScheduleController
 *
 * GET /api/courses/{slug}/schedule?tier=Basic   (public - upcoming tests only)
 * GET /api/students/me/test-schedule            (student - own enrolments)
 */
class TestScheduleController
{
    private TestScheduleService $service;

    public function __construct(TestScheduleService $service)
    {
        $this->service = $service;
    }

    public function forCourse(Request $request, Response $response, array $args): Response
    {
        $tier = $request->getQueryParams()['tier'] ?? null;
        $tier = is_string($tier) && $tier !== '' ? $tier : null;
        return $this->json($response, $this->service->forCourse($args['slug'], $tier));
    }

    public function forStudent(Request $request, Response $response, array $args): Response
    {
        return $this->json($response, $this->service->forStudent($args['id']));
    }

    private function json(Response $response, array $result): Response
    {
        $response->getBody()->write(json_encode($result));
        return $response
            ->withStatus($result['success'] ? 200 : 404)
            ->withHeader('Content-Type', 'application/json');
    }
}
