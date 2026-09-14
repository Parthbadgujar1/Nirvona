<?php

/**
 * Migration: Create Payments Table
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS payments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                studentId UUID NOT NULL REFERENCES students(id),
                packageId UUID,
                courseSlug VARCHAR(100),
                amount DECIMAL(10, 2),
                discount DECIMAL(10, 2),
                tax DECIMAL(10, 2),
                total DECIMAL(10, 2),
                status VARCHAR(50) DEFAULT 'pending',
                method VARCHAR(50),
                transactionId VARCHAR(255),
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                retryCount INT DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX idx_payments_studentId ON payments(studentId);
            CREATE INDEX idx_payments_status ON payments(status);
            CREATE INDEX idx_payments_date ON payments(date);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS payments CASCADE;");
    },
];
