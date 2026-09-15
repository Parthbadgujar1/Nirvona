<?php

/**
 * Migration: Create Payments Table
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS payments (
                id CHAR(36) PRIMARY KEY,
                studentId CHAR(36) NOT NULL,
                packageId CHAR(36),
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
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_payments_student FOREIGN KEY (studentId) REFERENCES students(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_payments_studentId ON payments(studentId);
            CREATE INDEX idx_payments_status ON payments(status);
            CREATE INDEX idx_payments_date ON payments(date);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS payments;");
    },
];
