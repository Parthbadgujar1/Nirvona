<?php

/**
 * Migration: coupons
 *
 * Admin-issued discount codes, handed to a student manually (never
 * advertised on the site). Replaces the two hardcoded codes that lived in
 * PaymentService and in the frontend. A coupon takes `percent` off the
 * package's (already discounted) price, on top of the package's own
 * discount. Usage is derived from successful payments, so there is no
 * counter to drift out of step.
 */
return [
    'up' => function (\PDO $pdo) {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS coupons (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(40) NOT NULL UNIQUE,
                percent INT NOT NULL CHECK (percent BETWEEN 1 AND 100),
                description VARCHAR(255),
                status VARCHAR(20) NOT NULL DEFAULT 'active',
                maxUses INT,
                expiresAt TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            ALTER TABLE payments ADD COLUMN IF NOT EXISTS couponCode VARCHAR(40);
            ALTER TABLE payments ADD COLUMN IF NOT EXISTS couponDiscount DECIMAL(10, 2) DEFAULT 0;
            CREATE INDEX IF NOT EXISTS idx_payments_couponCode ON payments(couponCode);
        ");
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("
            ALTER TABLE payments DROP COLUMN IF EXISTS couponDiscount;
            ALTER TABLE payments DROP COLUMN IF EXISTS couponCode;
            DROP TABLE IF EXISTS coupons;
        ");
    },
];
