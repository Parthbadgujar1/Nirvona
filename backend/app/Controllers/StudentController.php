<?php

namespace Nirvona\Controllers;

use Nirvona\Services\StudentService;
use Nirvona\Services\ExamService;
use Nirvona\Services\ResultService;
use Nirvona\Services\NotificationService;
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
    private ExamService $examService;
    private ResultService $resultService;
    private NotificationService $notificationService;

    public function __construct(
        StudentService $studentService,
        ExamService $examService,
        ResultService $resultService,
        NotificationService $notificationService
    ) {
        $this->studentService = $studentService;
        $this->examService = $examService;
        $this->resultService = $resultService;
        $this->notificationService = $notificationService;
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
        $data = json_decode($request->getBody(), true) ?? [];
        // Students can no longer edit their own profile (name, gender,
        // mobile, ...): they file a change request for an admin to approve
        // (see ProfileChangeRequestController). Only their notification
        // channel preferences remain self-service; anything else in the
        // body is discarded, never applied.
        $data = is_array($data) ? array_intersect_key($data, ['notificationPrefs' => true]) : [];
        if ($data === []) {
            $result = [
                'success' => false,
                'error' => [
                    'code' => 'profile_locked',
                    'message' => 'Profile details can only be changed by the admin. Please send a change request.',
                ],
            ];
            $response->getBody()->write(json_encode($result));
            return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
        }
        $result = $this->studentService->updateProfile($studentId, $data);

        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response
            ->withStatus($statusCode)
            ->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/students/me/password
     */
    public function changePassword(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->studentService->changePassword(
            $args['id'],
            (string) ($data['currentPassword'] ?? ''),
            (string) ($data['newPassword'] ?? '')
        );

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

    /**
     * GET /api/students/me/dashboard
     *
     * Combines every fetch the student dashboard page needs (profile,
     * enrollments, exams, results, performance, notifications) into one
     * HTTP round trip. The dashboard previously fired 6 separate GETs
     * that each queue behind each other on PHP's single-threaded `php
     * -S` dev server (it handles one request at a time), so the page
     * took roughly 6x one request's latency to finish loading even
     * though every individual call was fast. One request here still
     * does the same underlying work, just without the extra network
     * round trips and dev-server queuing in between.
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getDashboard(Request $request, Response $response, array $args): Response
    {
        $studentId = $args['id'];

        $student = $this->studentService->getStudent($studentId);
        $enrollments = $this->studentService->getEnrollments($studentId);
        $exams = $this->examService->getUpcomingExams();
        $results = $this->resultService->getStudentResults($studentId);
        $performance = $this->resultService->getPerformanceAnalytics($studentId, '');
        $notifications = $this->notificationService->getForStudent($studentId);

        $result = [
            'success' => true,
            'data' => [
                'student' => $student['data'] ?? $student,
                'enrollments' => $enrollments['data'] ?? $enrollments,
                'exams' => $exams['data'] ?? $exams,
                'results' => $results['data'] ?? $results,
                'performance' => $performance['data'] ?? $performance,
                'notifications' => $notifications['data'] ?? $notifications,
            ],
        ];

        $response->getBody()->write(json_encode($result));
        return $response
            ->withStatus(200)
            ->withHeader('Content-Type', 'application/json');
    }
}
