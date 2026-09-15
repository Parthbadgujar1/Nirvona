<?php

/**
 * Migration: Create Courses Table
 *
 * Course catalogue (JEE, NEET, Class 11/12, etc). Slug is the natural
 * primary key since it's already used as a foreign key throughout the
 * app (exams.courseSlug, payments.courseSlug, results.courseSlug).
 *
 * Nested/variable-shape fields (audience, highlights, exam pattern rows,
 * FAQs, stats) are stored as JSONB - they mirror the frontend's
 * `Course` type almost verbatim, so the repository can pass them
 * through with a single json_decode instead of joining several tables.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS courses (
                slug VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                shortName VARCHAR(100),
                tagline VARCHAR(500),
                description TEXT,
                audience JSONB NOT NULL DEFAULT '[]',
                maxDurationMonths INT DEFAULT 12,
                totalTests INT DEFAULT 0,
                accent VARCHAR(20) DEFAULT 'navy',
                icon VARCHAR(100),
                highlights JSONB NOT NULL DEFAULT '[]',
                examPattern JSONB NOT NULL DEFAULT '[]',
                patternNotes JSONB NOT NULL DEFAULT '[]',
                faqs JSONB NOT NULL DEFAULT '[]',
                stats JSONB NOT NULL DEFAULT '[]',
                status VARCHAR(20) DEFAULT 'active',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX idx_courses_status ON courses(status);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS courses CASCADE;");
    },
];
