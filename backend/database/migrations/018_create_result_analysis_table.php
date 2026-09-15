<?php

/**
 * Migration: Create Result Analysis Table
 *
 * Cached/derived performance analysis per student per course - the
 * backing store for the frontend's `PerformanceAnalysis` type
 * (score/rank/accuracy trends, subject comparison, strengths/
 * weaknesses, time distribution). Regenerated whenever a new result is
 * published for that student+course; read-heavy, write-light, so the
 * trend arrays are stored as JSON rather than normalized tables.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS result_analysis (
                id CHAR(36) PRIMARY KEY,
                studentId CHAR(36) NOT NULL,
                courseSlug VARCHAR(50),
                scoreTrend JSON NULL,
                rankTrend JSON NULL,
                accuracyTrend JSON NULL,
                subjectComparison JSON NULL,
                strengths JSON NULL,
                weaknesses JSON NULL,
                improvements JSON NULL,
                timeDistribution JSON NULL,
                summary TEXT,
                improvementPercent DECIMAL(5, 2) DEFAULT 0,
                generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(studentId, courseSlug),
                CONSTRAINT fk_result_analysis_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
                CONSTRAINT fk_result_analysis_course FOREIGN KEY (courseSlug) REFERENCES courses(slug) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_result_analysis_studentId ON result_analysis(studentId);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS result_analysis;");
    },
];
