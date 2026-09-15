<?php

/**
 * Migration: Create Exam Centres Table
 *
 * Physical/virtual exam centres. Already joined by
 * ExamRepository::getWithDetails() via exams.centreId - this migration
 * (plus the FK added in 021_add_foreign_key_constraints.php) is what
 * makes that join resolve to real data.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS exam_centres (
                id CHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50) UNIQUE NOT NULL,
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(10),
                capacity INT DEFAULT 0,
                labs INT DEFAULT 0,
                contact VARCHAR(50),
                status VARCHAR(20) DEFAULT 'active',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_exam_centres_city ON exam_centres(city);
            CREATE INDEX idx_exam_centres_status ON exam_centres(status);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS exam_centres;");
    },
];
