<?php

namespace Nirvona\Controllers;

use Nirvona\Services\AdminService;
use Nirvona\Services\ExamService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * AdminController
 *
 * Handles HTTP requests for admin operations. Previously returned
 * entirely hardcoded fake data (a static student count, an empty
 * students list regardless of what's in the database, a fabricated
 * exam ID on "create") - now backed by AdminService/ExamService, which
 * read from and write to the real repositories.
 */
class AdminController
{
    private AdminService $adminService;
    private ExamService $examService;

    public function __construct(AdminService $adminService, ExamService $examService)
    {
        $this->adminService = $adminService;
        $this->examService = $examService;
    }

    /**
     * GET /api/admin/dashboard
     */
    public function getDashboard(Request $request, Response $response): Response
    {
        $result = $this->adminService->getDashboardStats();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/students
     */
    public function listStudents(Request $request, Response $response): Response
    {
        [$page, $pageSize] = $this->getPagination($request);
        $result = $this->adminService->listStudents($page, $pageSize);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/admin/students/{id}
     */
    public function updateStudent(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->adminService->updateStudent($args['id'], $data);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/students/{id}/deactivate
     */
    public function deactivateStudent(Request $request, Response $response, array $args): Response
    {
        $result = $this->adminService->deactivateStudent($args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/students/{id}/reactivate
     */
    public function reactivateStudent(Request $request, Response $response, array $args): Response
    {
        $result = $this->adminService->reactivateStudent($args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/payments
     */
    public function listPayments(Request $request, Response $response): Response
    {
        [$page, $pageSize] = $this->getPagination($request);
        $result = $this->adminService->listPayments($page, $pageSize);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/payments/{id}/refund
     */
    public function refundPayment(Request $request, Response $response, array $args): Response
    {
        $result = $this->adminService->refundPayment($args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/exams
     */
    public function listExams(Request $request, Response $response): Response
    {
        [$page, $pageSize] = $this->getPagination($request);
        $result = $this->adminService->listExams($page, $pageSize);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/exams/{id}
     *
     * The exam-candidates page (`adminService.exam(id)`) has called
     * this since it was written, but no route ever existed for it -
     * every request 405'd and the page never had real exam details to
     * show alongside its candidate list.
     */
    public function getExam(Request $request, Response $response, array $args): Response
    {
        $result = $this->examService->getExam($args['id']);
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/exams
     */
    public function createExam(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->examService->scheduleExam($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/admin/exams/{id}
     *
     * Edit-form saves and status-only changes (publish/close) both go
     * through here - neither had a real backend endpoint before, so
     * both only ever mutated local frontend state.
     */
    public function updateExam(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->examService->updateExam($args['id'], $data);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/analytics/revenue-trend
     */
    public function getRevenueTrend(Request $request, Response $response): Response
    {
        $result = $this->adminService->getRevenueTrend();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/analytics/registration-trend
     */
    public function getRegistrationTrend(Request $request, Response $response): Response
    {
        $result = $this->adminService->getRegistrationTrend();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/analytics/participation-trend
     */
    public function getParticipationTrend(Request $request, Response $response): Response
    {
        $result = $this->adminService->getParticipationTrend();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/analytics/course-split
     */
    public function getCourseSplit(Request $request, Response $response): Response
    {
        $result = $this->adminService->getCourseSplit();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/activity
     */
    public function getActivity(Request $request, Response $response): Response
    {
        $result = $this->adminService->getActivity();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/admin/reports
     */
    public function getReports(Request $request, Response $response): Response
    {
        $result = $this->adminService->getReports();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Parse ?page=&pageSize= query params with sane bounds
     *
     * @param Request $request
     * @return array{0:int,1:int}
     */
    private function getPagination(Request $request): array
    {
        $params = $request->getQueryParams();
        $page = max(1, (int) ($params['page'] ?? 1));
        // Admin-only endpoints: a page may be large so the admin screens (which
        // search/sort the whole list in the browser) need only a few requests.
        $pageSize = min(1000, max(1, (int) ($params['pageSize'] ?? 20)));
        return [$page, $pageSize];
    }
}
