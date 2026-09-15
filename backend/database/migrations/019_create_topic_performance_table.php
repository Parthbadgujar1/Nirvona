<?php

/**
 * Migration: Create Topic Performance Table
 *
 * Per-student, per-topic accuracy rollup used to render strengths/
 * weaknesses and topic trend charts. One row per
 * (student, course, subject, topic) combination, upserted as new
 * results come in.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS topic_performance (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                courseSlug VARCHAR(50) REFERENCES courses(slug) ON DELETE CASCADE,
                subject VARCHAR(100) NOT NULL,
                topic VARCHAR(255) NOT NULL,
                accuracy DECIMAL(5, 2) DEFAULT 0,
                attempted INT DEFAULT 0,
                total INT DEFAULT 0,
                trend DECIMAL(5, 2) DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(studentId, courseSlug, subject, topic)
            );

            CREATE INDEX idx_topic_performance_studentId ON topic_performance(studentId);
            CREATE INDEX idx_topic_performance_accuracy ON topic_performance(accuracy);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS topic_performance CASCADE;");
    },
];
