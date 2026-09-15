<?php

/**
 * Migration: Create Exam Credentials Table
 *
 * Exam-hall CBT login credentials - deliberately separate from the
 * student's portal account (see the frontend's `ExamCredential` type).
 *
 * The column is `passwordHash`, not `password`: this is a real backend
 * table, so the plaintext-in-a-column shape the mock data uses is not
 * acceptable here. The repository must write with password_hash() and
 * never read/return the hash to a client - only issue it once at
 * generation time.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS exam_credentials (
                id CHAR(36) PRIMARY KEY,
                studentId CHAR(36) NOT NULL,
                examId CHAR(36) NOT NULL,
                studentName VARCHAR(255),
                loginId VARCHAR(100) NOT NULL UNIQUE,
                passwordHash VARCHAR(255) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                assignedAt TIMESTAMP NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(studentId, examId),
                CONSTRAINT fk_exam_credentials_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
                CONSTRAINT fk_exam_credentials_exam FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_exam_credentials_examId ON exam_credentials(examId);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS exam_credentials;");
    },
];
