<?php

/**
 * Migration: Create Topics Table
 *
 * Curriculum topic catalogue (e.g. "Laws of Motion" under Physics).
 * This is the normalized topic bank; per-student topic accuracy lives
 * separately in `topic_performance` (analytics, not curriculum).
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS topics (
                id CHAR(36) PRIMARY KEY,
                subjectId CHAR(36) NOT NULL,
                courseSlug VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                unitTitle VARCHAR(255),
                orderIndex INT DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_topics_subject FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE,
                CONSTRAINT fk_topics_course FOREIGN KEY (courseSlug) REFERENCES courses(slug) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_topics_subjectId ON topics(subjectId);
            CREATE INDEX idx_topics_courseSlug ON topics(courseSlug);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS topics;");
    },
];
