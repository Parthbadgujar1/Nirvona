<?php

namespace Nirvona\Services;

use Nirvona\Repositories\PaymentRepository;
use Nirvona\Repositories\PackageRepository;
use Nirvona\Integrations\RazorpayClient;
use Nirvona\Exceptions\ServiceException;

/**
 * PaymentService
 *
 * Handles payment processing with error isolation.
 * Even if Payment Service fails, Student/Exam/Result services continue.
 *
 * Uses Circuit Breaker to prevent cascade failures to payment gateway.
 */
class PaymentService extends BaseService
{
    private PaymentRepository $paymentRepository;
    private PackageRepository $packageRepository;
    private RazorpayClient $razorpay;
    private EnrollmentService $enrollmentService;

    /** Server-side coupon table - mirrors the frontend's (deliberately
     * public/informational) checkout.service.ts COUPONS map. Recomputed
     * here rather than trusting whatever discount percent the client
     * sends, since the order amount is what actually gets charged. */
    private const COUPONS = [
        'NIRVONA10' => 10,
        'FIRSTCBT' => 15,
    ];

    private const GST_RATE = 0.18;

    public function __construct(
        PaymentRepository $paymentRepository,
        PackageRepository $packageRepository,
        RazorpayClient $razorpay,
        EnrollmentService $enrollmentService,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->paymentRepository = $paymentRepository;
        $this->packageRepository = $packageRepository;
        $this->razorpay = $razorpay;
        $this->enrollmentService = $enrollmentService;
    }

    /**
     * Create a Razorpay order for a package purchase. The amount is
     * always computed here from the package's real price (plus an
     * optional server-validated coupon) - never trusted from the
     * client - so a tampered request can't buy a package for less than
     * its actual price.
     *
     * @param array $data studentId, packageId, courseSlug, couponCode?
     * @return array
     */
    public function createOrder(array $data): array
    {
        // An admin who retires a package (status = inactive) expects it to
        // stop being purchasable immediately - the public listing already
        // hides it, this stops a stale page/direct API call too. Checked
        // outside the circuit breaker so the specific message isn't masked
        // by the generic gateway fallback.
        if (!empty($data['packageId'])) {
            $existing = $this->packageRepository->getById($data['packageId']);
            if ($existing && ($existing['status'] ?? 'active') !== 'active') {
                $message = 'This package is no longer available.';
                return [
                    'success' => false,
                    'data' => null,
                    'message' => $message,
                    'error' => ['code' => 'package_unavailable', 'message' => $message],
                    'retryable' => false,
                ];
            }
        }

        return $this->executeWithCircuitBreaker(
            'RazorpayGateway',
            function () use ($data) {
                $errors = $this->validate($data, [
                    'studentId' => ['required'],
                    'packageId' => ['required'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Invalid order data: " . json_encode($errors),
                        'PaymentService',
                        false
                    );
                }

                $package = $this->packageRepository->getById($data['packageId']);
                if (!$package) {
                    throw new ServiceException(
                        "Package not found: {$data['packageId']}",
                        'PaymentService',
                        false
                    );
                }

                $couponCode = strtoupper(trim($data['couponCode'] ?? ''));
                $couponPercent = self::COUPONS[$couponCode] ?? 0;

                $listPrice = (float) ($package['originalPrice'] ?? $package['price']);
                $packageDiscount = $listPrice - (float) $package['price'];
                $coupon = round(((float) $package['price'] * $couponPercent) / 100);
                $taxableValue = (float) $package['price'] - $coupon;
                $gst = round($taxableValue * self::GST_RATE);
                $total = $taxableValue + $gst;

                // Payment row is created up front in "created" status so
                // the frontend has a real internal payment id to send
                // back on the verify call, and so an abandoned checkout
                // (user closes the widget) still leaves an auditable
                // record instead of vanishing silently.
                $payment = $this->paymentRepository->create([
                    'studentId' => $data['studentId'],
                    'packageId' => $data['packageId'],
                    'courseSlug' => $data['courseSlug'] ?? $package['courseSlug'] ?? null,
                    'amount' => $listPrice,
                    'discount' => $packageDiscount + $coupon,
                    'tax' => $gst,
                    'total' => $total,
                    'status' => 'created',
                    'date' => date('Y-m-d H:i:s'),
                ]);

                try {
                    $order = $this->razorpay->createOrder(
                        (int) round($total * 100),
                        'INR',
                        $payment['id'],
                        ['studentId' => $data['studentId'], 'packageId' => $data['packageId']]
                    );
                } catch (\Throwable $e) {
                    $this->paymentRepository->update($payment['id'], ['status' => 'failed']);
                    throw new ServiceException(
                        "Razorpay order creation failed: " . $e->getMessage(),
                        'PaymentService',
                        true
                    );
                }

                $this->paymentRepository->update($payment['id'], ['razorpayOrderId' => $order['id']]);

                $this->auditLog('PAYMENT_ORDER_CREATE', 'Payment', $payment['id'], [
                    'studentId' => $data['studentId'],
                    'total' => $total,
                    'razorpayOrderId' => $order['id'],
                ]);

                return [
                    'success' => true,
                    'data' => [
                        'paymentId' => $payment['id'],
                        'razorpayOrderId' => $order['id'],
                        'razorpayKeyId' => $this->razorpay->getKeyId(),
                        'amount' => $total,
                        'amountPaise' => $order['amount'],
                        'currency' => $order['currency'],
                        'summary' => [
                            'subtotal' => $listPrice,
                            'discount' => $packageDiscount + $coupon,
                            'taxableValue' => $taxableValue,
                            'gst' => $gst,
                            'total' => $total,
                        ],
                    ],
                ];
            },
            [
                'success' => false,
                'data' => null,
                'message' => 'Payment gateway is experiencing issues. Please try again shortly.',
                'error' => [
                    'code' => 'gateway_unavailable',
                    'message' => 'Payment gateway is experiencing issues. Please try again shortly.',
                ],
                'retryable' => true,
            ]
        );
    }

    /**
     * Get payment by ID
     *
     * @param string $paymentId
     * @return array Payment data
     */
    public function getPayment(string $paymentId): array
    {
        return $this->executeWithFallback(
            function () use ($paymentId) {
                $payment = $this->paymentRepository->getById($paymentId);

                if (!$payment) {
                    throw new ServiceException(
                        "Payment not found: {$paymentId}",
                        'PaymentService',
                        false
                    );
                }

                return [
                    'success' => true,
                    'data' => $payment,
                ];
            },
            [
                'success' => false,
                'error' => 'Unable to fetch payment details',
            ],
            'getPayment'
        );
    }

    /**
     * Verify a completed Razorpay Checkout payment and, if genuine,
     * finalize it: mark the payment successful and enroll the student
     * into the course. This is the only step that can be trusted to
     * mean "money actually changed hands" - the signature is proof the
     * response came from Razorpay and wasn't forged by a tampered
     * client (see RazorpayClient::verifySignature).
     *
     * @param array $data paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature, method?
     * @return array
     */
    public function verifyPayment(array $data): array
    {
        return $this->executeWithCircuitBreaker(
            'RazorpayVerification',
            function () use ($data) {
                $errors = $this->validate($data, [
                    'paymentId' => ['required'],
                    'razorpayOrderId' => ['required'],
                    'razorpayPaymentId' => ['required'],
                    'razorpaySignature' => ['required'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Invalid verification data: " . json_encode($errors),
                        'PaymentService',
                        false
                    );
                }

                $payment = $this->paymentRepository->getById($data['paymentId']);
                if (!$payment) {
                    throw new ServiceException(
                        "Payment not found: {$data['paymentId']}",
                        'PaymentService',
                        false
                    );
                }

                if (($payment['razorpayOrderId'] ?? null) !== $data['razorpayOrderId']) {
                    throw new ServiceException(
                        "Order id mismatch for payment {$data['paymentId']}",
                        'PaymentService',
                        false
                    );
                }

                $isGenuine = $this->razorpay->verifySignature(
                    $data['razorpayOrderId'],
                    $data['razorpayPaymentId'],
                    $data['razorpaySignature']
                );

                if (!$isGenuine) {
                    $this->paymentRepository->update($data['paymentId'], ['status' => 'failed']);
                    $this->auditLog('PAYMENT_VERIFY_FAILED', 'Payment', $data['paymentId'], [
                        'razorpayPaymentId' => $data['razorpayPaymentId'],
                    ]);

                    return [
                        'success' => false,
                        'status' => 'failed',
                        'message' => 'Payment signature verification failed',
                        'error' => [
                            'code' => 'signature_mismatch',
                            'message' => 'We could not verify this payment. If money was deducted, it will be refunded automatically.',
                        ],
                    ];
                }

                $this->paymentRepository->update($data['paymentId'], [
                    'status' => 'successful',
                    'transactionId' => $data['razorpayPaymentId'],
                    'razorpaySignature' => $data['razorpaySignature'],
                    'method' => $data['method'] ?? 'razorpay',
                ]);

                $this->auditLog('PAYMENT_VERIFY', 'Payment', $data['paymentId'], [
                    'razorpayPaymentId' => $data['razorpayPaymentId'],
                    'status' => 'successful',
                ]);

                // Enrollment failure here shouldn't undo a genuine,
                // already-captured payment - it's logged and isolated by
                // EnrollmentService's own executeWithFallback rather than
                // thrown back up.
                $enrollment = $this->enrollmentService->enroll([
                    'studentId' => $payment['studentId'],
                    'courseSlug' => $payment['courseSlug'],
                    'packageId' => $payment['packageId'],
                    'paymentId' => $data['paymentId'],
                ]);

                return [
                    'success' => true,
                    'status' => 'successful',
                    'message' => 'Payment verified successfully',
                    'data' => [
                        'payment' => $this->paymentRepository->getById($data['paymentId']),
                        'enrollment' => $enrollment['data'] ?? null,
                    ],
                ];
            },
            [
                'success' => false,
                'status' => 'pending',
                'message' => 'Verification service temporarily unavailable',
                'retryable' => true,
            ]
        );
    }

    /**
     * Get student's payment history
     *
     * @param string $studentId
     * @return array List of payments
     */
    public function getPaymentHistory(string $studentId): array
    {
        return $this->executeWithFallback(
            function () use ($studentId) {
                return [
                    'success' => true,
                    'data' => $this->paymentRepository->getByStudentId($studentId),
                ];
            },
            [
                'success' => true,
                'data' => [],
                'message' => 'Payment history temporarily unavailable',
            ],
            'getPaymentHistory'
        );
    }

}
