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
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                courseSlug VARCHAR(50) NOT NULL REFERENCES courses(slug),
                packageId UUID NOT NULL REFERENCES packages(id),
                paymentId UUID REFERENCES payments(id) ON DELETE SET NULL,
                startDate DATE NOT NULL,
                endDate DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                testsTaken INT DEFAULT 0,
                testsTotal INT DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX idx_enrollments_studentId ON enrollments(studentId);
            CREATE INDEX idx_enrollments_status ON enrollments(status);
            CREATE INDEX idx_enrollments_courseSlug ON enrollments(courseSlug);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS enrollments CASCADE;");
    },
];
