<?php

namespace Nirvona\Services;

use Nirvona\Repositories\PaymentRepository;
use Nirvona\Repositories\PackageRepository;
use Nirvona\Config\App;
use Nirvona\Integrations\PhonePeClient;
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
    private PhonePeClient $phonePe;
    private EnrollmentService $enrollmentService;

    private const GST_RATE = 0.18;

    private CouponService $couponService;

    public function __construct(
        PaymentRepository $paymentRepository,
        PackageRepository $packageRepository,
        PhonePeClient $phonePe,
        EnrollmentService $enrollmentService,
        CouponService $couponService,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->paymentRepository = $paymentRepository;
        $this->packageRepository = $packageRepository;
        $this->phonePe = $phonePe;
        $this->enrollmentService = $enrollmentService;
        $this->couponService = $couponService;
    }

    /**
     * The single source of truth for what a package costs at checkout:
     * package price (already net of the package's own discount), less the
     * admin-issued coupon percent (if any), plus GST. Used both for the
     * live "apply coupon" preview and for the amount actually charged, so
     * the two can never disagree. Throws a ServiceException with a
     * student-safe message for an unusable coupon.
     *
     * @param array<string, mixed> $package
     * @return array<string, mixed>
     */
    private function priceQuote(array $package, string $couponCode): array
    {
        $couponCode = CouponService::normalizeCode($couponCode);
        $couponPercent = 0;
        if ($couponCode !== '') {
            $couponPercent = (int) $this->couponService->resolve($couponCode)['percent'];
        }

        $price = (float) $package['price'];
        $listPrice = (float) ($package['originalPrice'] ?? $price);
        $packageDiscount = max(0.0, $listPrice - $price);
        $couponDiscount = round($price * $couponPercent / 100);
        $taxableValue = $price - $couponDiscount;
        $gst = round($taxableValue * self::GST_RATE);
        $total = $taxableValue + $gst;

        // The gateway cannot process an order below ₹1 (and a zero-price,
        // not-yet-priced package must never be sold at all).
        if ($price <= 0 || $total < 1) {
            throw new ServiceException('This package cannot be purchased at the moment.', 'PaymentService', false);
        }

        return [
            'couponCode' => $couponPercent > 0 ? $couponCode : null,
            'couponPercent' => $couponPercent,
            'subtotal' => $listPrice,
            'packageDiscount' => $packageDiscount,
            'couponDiscount' => $couponDiscount,
            'discount' => $packageDiscount + $couponDiscount,
            'taxableValue' => $taxableValue,
            'gst' => $gst,
            'total' => $total,
        ];
    }

    /**
     * Live price preview for the checkout page (POST .../payments/quote).
     *
     * @param array<string, mixed> $data packageId, couponCode?
     */
    public function quote(array $data): array
    {
        $packageId = (string) ($data['packageId'] ?? '');
        $isUuid = (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $packageId);
        $package = $isUuid ? $this->packageRepository->getById($packageId) : null;
        if (!$package || ($package['status'] ?? 'active') !== 'active') {
            return $this->failure('package_not_found', 'This package could not be found.', false);
        }
        try {
            $quote = $this->priceQuote($package, (string) ($data['couponCode'] ?? ''));
        } catch (ServiceException $e) {
            return $this->failure('invalid_coupon', $e->getMessage(), false);
        }
        return ['success' => true, 'data' => ['summary' => $quote]];
    }

    /**
     * Start a PhonePe checkout for a package purchase. The amount is
     * always computed here from the package's real price (plus an
     * optional server-validated coupon) - never trusted from the
     * client - so a tampered request can't buy a package for less than
     * its actual price.
     *
     * Returns the PhonePe-hosted payment page URL; the browser is sent
     * there, and comes back to the frontend's /payment/status page, which
     * then asks verifyPayment() what really happened.
     *
     * @param array $data studentId, packageId, courseSlug, couponCode?
     * @return array
     */
    public function createOrder(array $data): array
    {
        // Checked outside the circuit breaker so these specific messages
        // aren't masked by its generic "gateway unavailable" fallback.
        if (!$this->phonePe->isConfigured()) {
            return $this->failure(
                'gateway_not_configured',
                'Online payments are not set up yet. Please contact support.',
                false
            );
        }

        // An admin who retires a package (status = inactive) expects it to
        // stop being purchasable immediately - the public listing already
        // hides it, this stops a stale page/direct API call too.
        if (!empty($data['packageId'])) {
            // A malformed id (someone editing the checkout URL) is simply "not found".
            $isUuid = (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', (string) $data['packageId']);
            $existing = $isUuid ? $this->packageRepository->getById($data['packageId']) : null;
            if (!$existing) {
                return $this->failure('package_not_found', 'This package could not be found.', false);
            }
            if (($existing['status'] ?? 'active') !== 'active') {
                return $this->failure('package_unavailable', 'This package is no longer available.', false);
            }

            // Price (and coupon) checked outside the circuit breaker so a bad
            // coupon is reported as such rather than as a gateway outage.
            try {
                $this->priceQuote($existing, (string) ($data['couponCode'] ?? ''));
            } catch (ServiceException $e) {
                return $this->failure('invalid_coupon', $e->getMessage(), false);
            }
        }

        return $this->executeWithCircuitBreaker(
            'PhonePeGateway',
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

                $quote = $this->priceQuote($package, (string) ($data['couponCode'] ?? ''));
                $listPrice = $quote['subtotal'];
                $packageDiscount = $quote['packageDiscount'];
                $coupon = $quote['couponDiscount'];
                $taxableValue = $quote['taxableValue'];
                $gst = $quote['gst'];
                $total = $quote['total'];

                // Payment row is created up front in "created" status so
                // the return trip has a real internal payment id to look
                // up, and so an abandoned checkout (customer closes the
                // PhonePe page) still leaves an auditable record instead
                // of vanishing silently.
                $payment = $this->paymentRepository->create([
                    'studentId' => $data['studentId'],
                    'packageId' => $data['packageId'],
                    'courseSlug' => $data['courseSlug'] ?? $package['courseSlug'] ?? null,
                    'amount' => $listPrice,
                    'discount' => $packageDiscount + $coupon,
                    'tax' => $gst,
                    'total' => $total,
                    'couponCode' => $quote['couponCode'],
                    'couponDiscount' => $coupon,
                    'status' => 'created',
                    'date' => date('Y-m-d H:i:s'),
                ]);

                $redirectUrl = rtrim(App::getFrontendUrl(), '/') . '/payment/status?payment=' . $payment['id'];

                try {
                    // Our payment id doubles as PhonePe's merchantOrderId.
                    $order = $this->phonePe->createPayment(
                        $payment['id'],
                        (int) round($total * 100),
                        $redirectUrl,
                        $package['name'] ?? 'Nirvona package purchase'
                    );
                } catch (\Throwable $e) {
                    $this->paymentRepository->update($payment['id'], ['status' => 'failed']);
                    throw new ServiceException(
                        "PhonePe order creation failed: " . $e->getMessage(),
                        'PaymentService',
                        true
                    );
                }

                $this->paymentRepository->update($payment['id'], ['gatewayOrderId' => $order['orderId']]);

                $this->auditLog('PAYMENT_ORDER_CREATE', 'Payment', $payment['id'], [
                    'studentId' => $data['studentId'],
                    'total' => $total,
                    'gatewayOrderId' => $order['orderId'],
                ]);

                return [
                    'success' => true,
                    'data' => [
                        'paymentId' => $payment['id'],
                        'redirectUrl' => $order['redirectUrl'],
                        'amount' => $total,
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
     * Find out what really happened to a payment by asking PhonePe
     * (server-to-server) and, if - and only if - PhonePe says it is
     * COMPLETED for the expected amount, finalize it: mark the payment
     * successful and enroll the student. The browser's return trip from
     * PhonePe and the webhook body are never trusted on their own.
     *
     * Safe to call repeatedly (the status page polls it, and the webhook
     * can race it): a payment is finalized and enrolled exactly once.
     *
     * @param string $paymentId
     * @param ?string $studentId When set, the payment must belong to them
     * @return array success + status ("successful" | "failed" | "pending") + data.payment
     */
    public function verifyPayment(string $paymentId, ?string $studentId = null): array
    {
        $payment = $this->paymentRepository->getById($paymentId);
        if (!$payment || ($studentId !== null && $payment['studentId'] !== $studentId)) {
            return $this->failure('payment_not_found', 'Payment not found.', false, 'not_found');
        }

        // Terminal states need no round trip to PhonePe.
        if (in_array($payment['status'], ['successful', 'failed'], true)) {
            return $this->outcome($payment);
        }

        return $this->executeWithCircuitBreaker(
            'PhonePeVerification',
            function () use ($payment) {
                try {
                    $remote = $this->phonePe->getOrderStatus($payment['id']);
                } catch (\Throwable $e) {
                    throw new ServiceException(
                        'PhonePe status check failed: ' . $e->getMessage(),
                        'PaymentService',
                        true
                    );
                }

                if ($remote['state'] === 'COMPLETED') {
                    $expectedPaise = (int) round(((float) $payment['total']) * 100);
                    if ($remote['amount'] !== $expectedPaise) {
                        // Paid, but not the amount we asked for: don't grant
                        // access, and leave a trail for manual review.
                        $this->paymentRepository->update($payment['id'], ['status' => 'failed']);
                        $this->auditLog('PAYMENT_AMOUNT_MISMATCH', 'Payment', $payment['id'], [
                            'expectedPaise' => $expectedPaise,
                            'reportedPaise' => $remote['amount'],
                        ]);
                        return $this->outcome(
                            $this->paymentRepository->getById($payment['id']),
                            'We could not confirm the amount paid. Please contact support with your order id.'
                        );
                    }

                    // Exactly-once: only the caller that flips the row does the
                    // enrolment, so a webhook racing the status poll can't
                    // double-enrol.
                    $won = $this->paymentRepository->markSuccessfulOnce(
                        $payment['id'],
                        $remote['transactionId'] ?? $remote['orderId'] ?? $payment['id'],
                        self::methodLabel($remote['paymentMode'])
                    );

                    if ($won) {
                        $this->auditLog('PAYMENT_VERIFY', 'Payment', $payment['id'], [
                            'gatewayOrderId' => $remote['orderId'],
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
                            'paymentId' => $payment['id'],
                        ]);

                        return $this->outcome(
                            $this->paymentRepository->getById($payment['id']),
                            null,
                            $enrollment['data'] ?? null
                        );
                    }

                    return $this->outcome($this->paymentRepository->getById($payment['id']));
                }

                if ($remote['state'] === 'FAILED') {
                    $this->paymentRepository->update($payment['id'], ['status' => 'failed']);
                    $this->auditLog('PAYMENT_VERIFY_FAILED', 'Payment', $payment['id'], [
                        'gatewayOrderId' => $remote['orderId'],
                    ]);
                    return $this->outcome($this->paymentRepository->getById($payment['id']));
                }

                // PENDING (customer still on PhonePe, or a UPI request not yet approved).
                return $this->outcome($payment);
            },
            [
                'success' => true,
                'status' => 'pending',
                'message' => 'Payment status is temporarily unavailable. Retrying...',
                'data' => ['status' => 'pending', 'payment' => $payment, 'reason' => null],
                'retryable' => true,
            ]
        );
    }

    /**
     * PhonePe webhook entry point. The Authorization header is checked,
     * then the order is re-verified with PhonePe rather than trusting the
     * body, so a forged call can at worst trigger a harmless status check.
     *
     * @param ?string $authorization Raw Authorization header
     * @param array $body Decoded webhook JSON
     */
    public function handleWebhook(?string $authorization, array $body): array
    {
        $valid = PhonePeClient::verifyWebhookAuthorization(
            $authorization,
            $_ENV['PHONEPE_WEBHOOK_USERNAME'] ?? '',
            $_ENV['PHONEPE_WEBHOOK_PASSWORD'] ?? ''
        );
        if (!$valid) {
            return $this->failure('unauthorized', 'Invalid webhook credentials.', false, 'unauthorized');
        }

        $payload = is_array($body['payload'] ?? null) ? $body['payload'] : $body;
        $merchantOrderId = (string) ($payload['merchantOrderId'] ?? '');
        if ($merchantOrderId === '') {
            return $this->failure('invalid_payload', 'Missing merchantOrderId.', false, 'invalid');
        }

        $result = $this->verifyPayment($merchantOrderId);
        // Always acknowledge a well-formed call so PhonePe doesn't keep retrying
        // for an unknown order.
        return ['success' => true, 'status' => $result['status'] ?? 'unknown'];
    }

    /** PhonePe payment modes (UPI_QR, CREDIT_CARD, NET_BANKING, ...) -> the labels the app shows. */
    private static function methodLabel(?string $mode): string
    {
        $mode = strtoupper((string) $mode);
        return match (true) {
            str_contains($mode, 'CARD') => 'Card',
            str_contains($mode, 'NET') => 'Netbanking',
            str_contains($mode, 'WALLET') => 'Wallet',
            default => 'UPI',
        };
    }

    /** Uniform "what state is this payment in" response for the status endpoint. */
    private function outcome(array $payment, ?string $reason = null, ?array $enrollment = null): array
    {
        $status = match ($payment['status']) {
            'successful' => 'successful',
            'failed' => 'failed',
            default => 'pending',
        };
        $reason ??= $status === 'failed' ? 'The payment was not completed.' : null;

        return [
            'success' => true,
            'status' => $status,
            'message' => match ($status) {
                'successful' => 'Payment verified successfully',
                'failed' => $reason,
                default => 'Payment is still being processed',
            },
            'data' => ['status' => $status, 'payment' => $payment, 'enrollment' => $enrollment, 'reason' => $reason],
        ];
    }

    private function failure(string $code, string $message, bool $retryable, string $kind = 'error'): array
    {
        return [
            'success' => false,
            'data' => null,
            'message' => $message,
            'error' => ['code' => $code, 'message' => $message],
            'retryable' => $retryable,
            'kind' => $kind,
        ];
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
