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
     * POST /api/students/me/payments/order
     *
     * Starts a PhonePe checkout for the authenticated student's package
     * purchase. `$args['id']` is injected by the student.php `$withId`
     * wrapper from the verified JWT, not sent by the client - the
     * amount charged is always derived server-side from the package.
     */
    public function createOrder(Request $request, Response $response, array $args): Response
    {
        $data = json_decode((string) $request->getBody(), true) ?? [];
        $data['studentId'] = $args['id'];
        $result = $this->paymentService->createOrder($data);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/students/me/payments/quote
     *
     * Price preview (with an optional coupon code) for the checkout page.
     * The same calculation createOrder() charges, so what the student sees
     * is exactly what they pay.
     */
    public function quote(Request $request, Response $response, array $args): Response
    {
        $data = json_decode((string) $request->getBody(), true) ?? [];
        $result = $this->paymentService->quote(is_array($data) ? $data : []);
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($result['success'] ? 200 : 400)->withHeader('Content-Type', 'application/json');
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
     * POST /api/students/me/payments/{paymentId}/verify
     *
     * Asks PhonePe what really happened to this payment (the status page
     * calls this on return from PhonePe and polls while it is pending).
     * `id` is the authenticated student, so nobody can probe - or finalize -
     * someone else's payment.
     */
    public function verify(Request $request, Response $response, array $args): Response
    {
        $result = $this->paymentService->verifyPayment($args['paymentId'], $args['id']);
        $statusCode = $result['success'] ? 200 : (($result['kind'] ?? '') === 'not_found' ? 404 : 400);
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/payments/phonepe/callback
     *
     * PhonePe's server-to-server webhook. Unauthenticated by JWT (PhonePe
     * has none) - it is authenticated by the Authorization header instead,
     * and even then only triggers a status re-check (see PaymentService).
     */
    public function phonePeCallback(Request $request, Response $response): Response
    {
        $body = json_decode((string) $request->getBody(), true) ?? [];
        $result = $this->paymentService->handleWebhook($request->getHeaderLine('Authorization'), $body);
        $statusCode = $result['success'] ? 200 : (($result['kind'] ?? '') === 'unauthorized' ? 401 : 400);
        $response->getBody()->write(json_encode(['success' => $result['success']]));
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
