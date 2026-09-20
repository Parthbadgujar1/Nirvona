<?php

/**
 * Migration: Replace Razorpay columns with a gateway-neutral order id
 *
 * The app moved from Razorpay to PhonePe. Razorpay's order id and
 * checkout signature no longer mean anything (PhonePe has no client-side
 * signature step - the server confirms a payment by asking PhonePe for
 * its status), so those columns are dropped. `gatewayOrderId` holds the
 * gateway's own order id for cross-referencing against the PhonePe
 * dashboard; our `payments.id` is what is sent to PhonePe as the
 * merchantOrderId.
 *
 * `transactionId` (already on the table) continues to hold the gateway's
 * transaction id for a successful payment.
 */
return [
    'up' => function (\PDO $pdo) {
        $pdo->exec("
            DROP INDEX IF EXISTS idx_payments_razorpayOrderId;

            ALTER TABLE payments
                DROP COLUMN IF EXISTS razorpayOrderId,
                DROP COLUMN IF EXISTS razorpaySignature,
                ADD COLUMN IF NOT EXISTS gatewayOrderId VARCHAR(255);

            CREATE INDEX IF NOT EXISTS idx_payments_gatewayOrderId ON payments(gatewayOrderId);
        ");
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("
            DROP INDEX IF EXISTS idx_payments_gatewayOrderId;
            ALTER TABLE payments DROP COLUMN IF EXISTS gatewayOrderId;
        ");
    },
];
