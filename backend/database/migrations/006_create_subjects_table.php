<?php

/**
 * Migration: Create Subjects Table
 *
 * Subjects belonging to a course (e.g. Physics, Chemistry under JEE).
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS subjects (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                courseSlug VARCHAR(50) NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
                code VARCHAR(20) NOT NULL,
                name VARCHAR(100) NOT NULL,
                color VARCHAR(20),
                orderIndex INT DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(courseSlug, code)
            );

            CREATE INDEX idx_subjects_courseSlug ON subjects(courseSlug);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS subjects CASCADE;");
    },
];
