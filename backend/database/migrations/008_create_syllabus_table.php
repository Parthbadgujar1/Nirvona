<?php

/**
 * Migration: Create Syllabus Table
 *
 * One row per syllabus unit within a subject (mirrors the frontend's
 * `SyllabusUnit.units[]` entries). `topics` is a JSONB array of topic
 * title strings for quick rendering; the normalized `topics` table is
 * the source of truth for analytics.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS syllabus (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                courseSlug VARCHAR(50) NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
                subjectId UUID REFERENCES subjects(id) ON DELETE SET NULL,
                subject VARCHAR(100) NOT NULL,
                unitTitle VARCHAR(255) NOT NULL,
                topics JSONB NOT NULL DEFAULT '[]',
                orderIndex INT DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX idx_syllabus_courseSlug ON syllabus(courseSlug);
            CREATE INDEX idx_syllabus_subjectId ON syllabus(subjectId);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS syllabus CASCADE;");
    },
];
