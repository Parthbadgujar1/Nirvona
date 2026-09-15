<?php

/**
 * Migration: Create Questions Table
 *
 * Question bank content for an exam (qNo is scoped to the exam, not
 * globally unique - two different exams can each have a "Q1").
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS questions (
                id CHAR(36) PRIMARY KEY,
                examId CHAR(36) NOT NULL,
                qNo INT NOT NULL,
                subject VARCHAR(100),
                topic VARCHAR(255),
                questionText TEXT NOT NULL,
                optionA TEXT,
                optionB TEXT,
                optionC TEXT,
                optionD TEXT,
                correctOption CHAR(1),
                marks DECIMAL(6, 2) DEFAULT 4,
                negativeMarks DECIMAL(6, 2) DEFAULT 1,
                difficulty VARCHAR(20) DEFAULT 'medium',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(examId, qNo),
                CONSTRAINT fk_questions_exam FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_questions_examId ON questions(examId);
            CREATE INDEX idx_questions_subject ON questions(subject);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS questions;");
    },
];
