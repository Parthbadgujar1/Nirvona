<?php

/**
 * Migration: Create Answer Keys Table
 *
 * One answer key per exam. `entries` is a JSON array of
 * {qNo, subject, topic, correctOption, marks, negative} - mirrors the
 * frontend's `AnswerKeyEntry[]` shape directly, avoiding a second
 * one-row-per-question child table for content that's always read and
 * written as a single unit (upload once, publish once).
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS answer_keys (
                id CHAR(36) PRIMARY KEY,
                examId CHAR(36) NOT NULL UNIQUE,
                totalQuestions INT DEFAULT 0,
                entries JSON NULL,
                status VARCHAR(20) DEFAULT 'draft',
                uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                publishedAt TIMESTAMP NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_answer_keys_exam FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_answer_keys_status ON answer_keys(status);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS answer_keys;");
    },
];
