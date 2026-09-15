<?php

/**
 * Migration: Add Razorpay columns to Payments
 *
 * PaymentService previously only mocked a gateway response
 * (`callRazorpayAPI`/`verifyWithRazorpay` just returned fabricated
 * data). Wiring a real Razorpay Order + signature-verification flow
 * needs somewhere to persist the order id Razorpay hands back at
 * creation time and the signature it hands back after checkout, so the
 * later verify step has something real to check against.
 * `transactionId` (already on the table) continues to hold the
 * Razorpay payment id (`pay_...`), matching what it always meant.
 */
return [
    'up' => function (\PDO $pdo) {
        $pdo->exec("
            ALTER TABLE payments
                ADD COLUMN IF NOT EXISTS razorpayOrderId VARCHAR(255),
                ADD COLUMN IF NOT EXISTS razorpaySignature VARCHAR(500);

            CREATE INDEX IF NOT EXISTS idx_payments_razorpayOrderId ON payments(razorpayOrderId);
        ");
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("
            ALTER TABLE payments
                DROP COLUMN IF EXISTS razorpayOrderId,
                DROP COLUMN IF EXISTS razorpaySignature;
        ");
    },
];
