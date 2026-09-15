<?php

namespace Nirvona\Controllers;

use Nirvona\Services\NotificationService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * NotificationController
 *
 * Handles HTTP requests for the notification log and per-student
 * portal feed.
 */
class NotificationController
{
    private NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * GET /api/admin/notifications
     */
    public function listForAdmin(Request $request, Response $response): Response
    {
        $result = $this->notificationService->getForAdmin();
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/notifications
     */
    public function create(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->notificationService->broadcast($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/notifications/{id}/retry
     */
    public function retry(Request $request, Response $response, array $args): Response
    {
        $result = $this->notificationService->retry($args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/admin/notifications/{id}
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $result = $this->notificationService->delete($args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/students/me/notifications
     */
    public function listForStudent(Request $request, Response $response, array $args): Response
    {
        $result = $this->notificationService->getForStudent($args['id']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/students/me/notifications/unread-count
     */
    public function unreadCount(Request $request, Response $response, array $args): Response
    {
        $result = $this->notificationService->getUnreadCount($args['id']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/students/me/notifications/{notificationId}/read
     */
    public function markRead(Request $request, Response $response, array $args): Response
    {
        $result = $this->notificationService->markRead($args['notificationId'], $args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/students/me/notifications/read-all
     */
    public function markAllRead(Request $request, Response $response, array $args): Response
    {
        $result = $this->notificationService->markAllRead($args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
}
