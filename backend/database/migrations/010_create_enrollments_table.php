<?php

/**
 * Migration: Create Enrollments Table
 *
 * Tracks a student's enrollment into a course via a purchased package.
 * Already queried by StudentRepository::getEnrollments() (joins
 * enrollments -> packages -> courses) - this migration is what makes
 * that query actually work against a real schema.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS enrollments (
                id CHAR(36) PRIMARY KEY,
                studentId CHAR(36) NOT NULL,
                courseSlug VARCHAR(50) NOT NULL,
                packageId CHAR(36) NOT NULL,
                paymentId CHAR(36),
                startDate DATE NOT NULL,
                endDate DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                testsTaken INT DEFAULT 0,
                testsTotal INT DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_enrollments_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
                CONSTRAINT fk_enrollments_course FOREIGN KEY (courseSlug) REFERENCES courses(slug),
                CONSTRAINT fk_enrollments_package FOREIGN KEY (packageId) REFERENCES packages(id),
                CONSTRAINT fk_enrollments_payment FOREIGN KEY (paymentId) REFERENCES payments(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_enrollments_studentId ON enrollments(studentId);
            CREATE INDEX idx_enrollments_status ON enrollments(status);
            CREATE INDEX idx_enrollments_courseSlug ON enrollments(courseSlug);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS enrollments;");
    },
];
