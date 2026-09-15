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
 *
 * No "IF NOT EXISTS" - MySQL doesn't support that clause on
 * ALTER TABLE ADD COLUMN or CREATE INDEX (MariaDB-only extensions).
 * Safe regardless: the migration runner tracks applied migrations and
 * never re-runs this file.
 */
return [
    'up' => function (\PDO $pdo) {
        $pdo->exec("
            ALTER TABLE payments
                ADD COLUMN razorpayOrderId VARCHAR(255),
                ADD COLUMN razorpaySignature VARCHAR(500);

            CREATE INDEX idx_payments_razorpayOrderId ON payments(razorpayOrderId);
        ");
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("
            ALTER TABLE payments
                DROP COLUMN razorpayOrderId,
                DROP COLUMN razorpaySignature;
        ");
    },
];
