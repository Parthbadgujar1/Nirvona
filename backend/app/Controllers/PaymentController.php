<?php

namespace Nirvona\Controllers;

use Nirvona\Services\PaymentService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * PaymentController
 *
 * Handles HTTP requests for payment operations.
 */
class PaymentController
{
    private PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * POST /api/payments
     */
    public function process(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody(), true);
        $result = $this->paymentService->processPayment($data);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/payments/{id}
     */
    public function get(Request $request, Response $response, array $args): Response
    {
        $result = $this->paymentService->getPayment($args['id']);
        $statusCode = $result['success'] ? 200 : 404;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/payments/{id}/verify
     */
    public function verify(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true);
        $result = $this->paymentService->verifyPayment($args['id'], $data['transactionId'] ?? '');
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/payments/student/{id}
     */
    public function getStudentPayments(Request $request, Response $response, array $args): Response
    {
        $result = $this->paymentService->getPaymentHistory($args['id']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
