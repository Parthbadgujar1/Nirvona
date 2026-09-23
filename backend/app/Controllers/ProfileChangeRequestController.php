<?php

namespace Nirvona\Controllers;

use Nirvona\Services\ProfileChangeRequestService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * ProfileChangeRequestController
 *
 * Student (id from the verified JWT):
 *   POST /api/students/me/change-requests
 *   GET  /api/students/me/change-requests
 * Admin:
 *   GET  /api/admin/change-requests?status=pending
 *   POST /api/admin/change-requests/{id}/approve
 *   POST /api/admin/change-requests/{id}/reject
 */
class ProfileChangeRequestController
{
    private ProfileChangeRequestService $service;

    public function __construct(ProfileChangeRequestService $service)
    {
        $this->service = $service;
    }

    public function create(Request $request, Response $response, array $args): Response
    {
        return $this->json($response, $this->service->create($args['id'], $this->body($request)), 201);
    }

    public function listMine(Request $request, Response $response, array $args): Response
    {
        return $this->json($response, $this->service->listMine($args['id']));
    }

    public function listForAdmin(Request $request, Response $response): Response
    {
        $status = $request->getQueryParams()['status'] ?? null;
        return $this->json($response, $this->service->listForAdmin(is_string($status) ? $status : null));
    }

    public function approve(Request $request, Response $response, array $args): Response
    {
        $note = $this->body($request)['adminNote'] ?? null;
        return $this->json($response, $this->service->approve(
            $args['id'],
            $request->getAttribute('userId'),
            is_string($note) ? $note : null
        ));
    }

    public function reject(Request $request, Response $response, array $args): Response
    {
        $note = $this->body($request)['adminNote'] ?? null;
        return $this->json($response, $this->service->reject(
            $args['id'],
            $request->getAttribute('userId'),
            is_string($note) ? $note : null
        ));
    }

    private function body(Request $request): array
    {
        $data = json_decode((string) $request->getBody(), true);
        return is_array($data) ? $data : [];
    }

    private function json(Response $response, array $result, int $okStatus = 200): Response
    {
        $response->getBody()->write(json_encode($result));
        return $response
            ->withStatus($result['success'] ? $okStatus : 400)
            ->withHeader('Content-Type', 'application/json');
    }
}
