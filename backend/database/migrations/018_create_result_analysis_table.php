<?php

/**
 * Migration: Create Result Analysis Table
 *
 * Cached/derived performance analysis per student per course - the
 * backing store for the frontend's `PerformanceAnalysis` type
 * (score/rank/accuracy trends, subject comparison, strengths/
 * weaknesses, time distribution). Regenerated whenever a new result is
 * published for that student+course; read-heavy, write-light, so the
 * trend arrays are stored as JSONB rather than normalized tables.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS result_analysis (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                courseSlug VARCHAR(50) REFERENCES courses(slug) ON DELETE CASCADE,
                scoreTrend JSONB NOT NULL DEFAULT '[]',
                rankTrend JSONB NOT NULL DEFAULT '[]',
                accuracyTrend JSONB NOT NULL DEFAULT '[]',
                subjectComparison JSONB NOT NULL DEFAULT '[]',
                strengths JSONB NOT NULL DEFAULT '[]',
                weaknesses JSONB NOT NULL DEFAULT '[]',
                improvements JSONB NOT NULL DEFAULT '[]',
                timeDistribution JSONB NOT NULL DEFAULT '[]',
                summary TEXT,
                improvementPercent DECIMAL(5, 2) DEFAULT 0,
                generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(studentId, courseSlug)
            );

            CREATE INDEX idx_result_analysis_studentId ON result_analysis(studentId);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS result_analysis CASCADE;");
    },
];
