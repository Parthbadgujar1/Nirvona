<?php

/**
 * Migration: Create Student Responses Table
 *
 * One row per student per exam holding their uploaded/evaluated OMR-
 * style response sheet. `rows` is a JSON array of per-question
 * {qNo, subject, topic, markedOption, correctOption, status,
 * timeSpentSec, marks} - mirrors `StudentResponseRow[]` and is always
 * read/written as a whole sheet, so it's kept as one JSON document
 * rather than one row per question.
 *
 * `rows` is backtick-quoted: it's a reserved word in MySQL 8.0.2+
 * (added for window-function frame clauses like ROWS BETWEEN).
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS student_responses (
                id CHAR(36) PRIMARY KEY,
                examId CHAR(36) NOT NULL,
                studentId CHAR(36) NOT NULL,
                `rows` JSON NULL,
                validation VARCHAR(20) DEFAULT 'pending',
                processing VARCHAR(20) DEFAULT 'queued',
                uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(examId, studentId),
                CONSTRAINT fk_student_responses_exam FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE CASCADE,
                CONSTRAINT fk_student_responses_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_student_responses_examId ON student_responses(examId);
            CREATE INDEX idx_student_responses_studentId ON student_responses(studentId);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS student_responses;");
    },
];
