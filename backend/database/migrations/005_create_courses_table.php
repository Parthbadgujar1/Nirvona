<?php

/**
 * Migration: Create Courses Table
 *
 * Course catalogue (JEE, NEET, Class 11/12, etc). Slug is the natural
 * primary key since it's already used as a foreign key throughout the
 * app (exams.courseSlug, payments.courseSlug, results.courseSlug).
 *
 * Nested/variable-shape fields (audience, highlights, exam pattern rows,
 * FAQs, stats) are stored as JSON - they mirror the frontend's `Course`
 * type almost verbatim, so the repository can pass them through with a
 * single json_decode instead of joining several tables.
 *
 * These columns are JSON NULL with no DB-side default: MySQL doesn't
 * allow a literal DEFAULT value on a JSON column (only Postgres's JSONB
 * did) - CourseRepository::decodeJsonColumns() treats a NULL the same
 * as an empty array, so every consumer still always gets a real array.
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
                audience JSON NULL,
                maxDurationMonths INT DEFAULT 12,
                totalTests INT DEFAULT 0,
                accent VARCHAR(20) DEFAULT 'navy',
                icon VARCHAR(100),
                highlights JSON NULL,
                examPattern JSON NULL,
                patternNotes JSON NULL,
                faqs JSON NULL,
                stats JSON NULL,
                status VARCHAR(20) DEFAULT 'active',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_courses_status ON courses(status);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS courses;");
    },
];
