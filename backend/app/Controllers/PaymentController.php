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
     * Creates a Razorpay order for the authenticated student's package
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
     */
    public function verify(Request $request, Response $response, array $args): Response
    {
        $data = json_decode((string) $request->getBody(), true) ?? [];
        $data['paymentId'] = $args['paymentId'];
        $result = $this->paymentService->verifyPayment($data);
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
