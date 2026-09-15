<?php

/**
 * Migration: Create Answer Keys Table
 *
 * One answer key per exam. `entries` is a JSONB array of
 * {qNo, subject, topic, correctOption, marks, negative} - mirrors the
 * frontend's `AnswerKeyEntry[]` shape directly, avoiding a second
 * one-row-per-question child table for content that's always read and
 * written as a single unit (upload once, publish once).
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS answer_keys (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                examId UUID NOT NULL UNIQUE REFERENCES exams(id) ON DELETE CASCADE,
                totalQuestions INT DEFAULT 0,
                entries JSONB NOT NULL DEFAULT '[]',
                status VARCHAR(20) DEFAULT 'draft',
                uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                publishedAt TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX idx_answer_keys_status ON answer_keys(status);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS answer_keys CASCADE;");
    },
];
