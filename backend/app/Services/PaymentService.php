<?php

namespace Nirvona\Services;

use Nirvona\Repositories\PaymentRepository;
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

    public function __construct(
        PaymentRepository $paymentRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->paymentRepository = $paymentRepository;
    }

    /**
     * Process payment through Razorpay
     *
     * Uses Circuit Breaker pattern:
     * - If Razorpay is down, return queued status instead of crashing
     * - Other services continue operating normally
     *
     * @param array $paymentData Payment information
     * @return array Processing status
     */
    public function processPayment(array $paymentData): array
    {
        return $this->executeWithCircuitBreaker(
            'RazorpayGateway',
            function () use ($paymentData) {
                // Validate payment data
                $errors = $this->validate($paymentData, [
                    'studentId' => ['required'],
                    'packageId' => ['required'],
                    'amount' => ['required', 'numeric'],
                    'method' => ['required'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Invalid payment data: " . json_encode($errors),
                        'PaymentService',
                        false
                    );
                }

                // Call Razorpay API with error handling
                try {
                    $razorpayResponse = $this->callRazorpayAPI($paymentData);

                    // Save payment record
                    $payment = $this->paymentRepository->create([
                        'studentId' => $paymentData['studentId'],
                        'packageId' => $paymentData['packageId'],
                        'amount' => $paymentData['amount'],
                        'method' => $paymentData['method'],
                        'transactionId' => $razorpayResponse['id'] ?? null,
                        'status' => $razorpayResponse['status'] ?? 'pending',
                        'date' => date('Y-m-d H:i:s'),
                    ]);

                    $this->auditLog('PAYMENT_PROCESS', 'Payment', $payment['id'], [
                        'studentId' => $paymentData['studentId'],
                        'amount' => $paymentData['amount'],
                    ]);

                    return [
                        'success' => true,
                        'data' => $payment,
                        'message' => 'Payment processed successfully',
                    ];
                } catch (\Exception $e) {
                    // If Razorpay fails, queue for retry and inform user
                    throw new ServiceException(
                        "Razorpay processing failed: " . $e->getMessage(),
                        'PaymentService',
                        true  // Retryable
                    );
                }
            },
            [
                'success' => false,
                'data' => null,
                'message' => 'Payment service temporarily unavailable',
                'error' => 'Payment gateway is experiencing issues. Please try again shortly.',
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
     * Verify payment status with Razorpay
     *
     * @param string $paymentId Payment ID
     * @param string $transactionId Razorpay transaction ID
     * @return array Updated payment status
     */
    public function verifyPayment(string $paymentId, string $transactionId): array
    {
        return $this->executeWithCircuitBreaker(
            'RazorpayVerification',
            function () use ($paymentId, $transactionId) {
                try {
                    // Verify with Razorpay
                    $verificationResult = $this->verifyWithRazorpay($transactionId);

                    // Update payment status
                    $this->paymentRepository->update($paymentId, [
                        'status' => $verificationResult['status'],
                    ]);

                    $this->auditLog('PAYMENT_VERIFY', 'Payment', $paymentId, [
                        'transactionId' => $transactionId,
                        'status' => $verificationResult['status'],
                    ]);

                    return [
                        'success' => true,
                        'status' => $verificationResult['status'],
                        'message' => 'Payment verified successfully',
                    ];
                } catch (\Exception $e) {
                    throw new ServiceException(
                        "Verification failed: " . $e->getMessage(),
                        'PaymentService',
                        true
                    );
                }
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

    /**
     * Mock Razorpay API call
     *
     * @param array $paymentData
     * @return array Razorpay response
     */
    private function callRazorpayAPI(array $paymentData): array
    {
        // This would call actual Razorpay API
        // For demo, returning mock response
        return [
            'id' => 'pay_' . uniqid(),
            'status' => 'authorized',
            'amount' => $paymentData['amount'] * 100, // Razorpay uses paise
        ];
    }

    /**
     * Mock Razorpay verification
     *
     * @param string $transactionId
     * @return array Verification result
     */
    private function verifyWithRazorpay(string $transactionId): array
    {
        // This would verify with actual Razorpay API
        // For demo, returning mock response
        return [
            'id' => $transactionId,
            'status' => 'captured',
        ];
    }
}
