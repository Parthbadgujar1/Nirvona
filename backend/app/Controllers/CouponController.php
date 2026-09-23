<?php

namespace Nirvona\Controllers;

use Nirvona\Services\CouponService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * CouponController - admin coupon management (/api/admin/coupons).
 * Students never list coupons; they only enter a code at checkout
 * (see PaymentController::quote).
 */
class CouponController
{
    private CouponService $service;

    public function __construct(CouponService $service)
    {
        $this->service = $service;
    }

    public function list(Request $request, Response $response): Response
    {
        return $this->json($response, $this->service->listForAdmin());
    }

    public function create(Request $request, Response $response): Response
    {
        return $this->json($response, $this->service->create($this->body($request)), 201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        return $this->json($response, $this->service->update($args['id'], $this->body($request)));
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        return $this->json($response, $this->service->delete($args['id']));
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
