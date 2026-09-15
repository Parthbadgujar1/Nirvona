<?php

/**
 * Migration: Create Syllabus Table
 *
 * One row per syllabus unit within a subject (mirrors the frontend's
 * `SyllabusUnit.units[]` entries). `topics` is a JSON array of topic
 * title strings for quick rendering; the normalized `topics` table is
 * the source of truth for analytics.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS syllabus (
                id CHAR(36) PRIMARY KEY,
                courseSlug VARCHAR(50) NOT NULL,
                subjectId CHAR(36),
                subject VARCHAR(100) NOT NULL,
                unitTitle VARCHAR(255) NOT NULL,
                topics JSON NULL,
                orderIndex INT DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_syllabus_course FOREIGN KEY (courseSlug) REFERENCES courses(slug) ON DELETE CASCADE,
                CONSTRAINT fk_syllabus_subject FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_syllabus_courseSlug ON syllabus(courseSlug);
            CREATE INDEX idx_syllabus_subjectId ON syllabus(subjectId);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS syllabus;");
    },
];
