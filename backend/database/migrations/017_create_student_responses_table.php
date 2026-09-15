<?php

/**
 * Migration: Create Student Responses Table
 *
 * One row per student per exam holding their uploaded/evaluated OMR-
 * style response sheet. `rows` is a JSONB array of per-question
 * {qNo, subject, topic, markedOption, correctOption, status,
 * timeSpentSec, marks} - mirrors `StudentResponseRow[]` and is always
 * read/written as a whole sheet, so it's kept as one JSON document
 * rather than one row per question.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS student_responses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
                studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                rows JSONB NOT NULL DEFAULT '[]',
                validation VARCHAR(20) DEFAULT 'pending',
                processing VARCHAR(20) DEFAULT 'queued',
                uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(examId, studentId)
            );

            CREATE INDEX idx_student_responses_examId ON student_responses(examId);
            CREATE INDEX idx_student_responses_studentId ON student_responses(studentId);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS student_responses CASCADE;");
    },
];
