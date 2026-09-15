<?php

/**
 * Migration: Create Exam Candidates Table
 *
 * Attendance & seat allocation - one row per student registered for an
 * exam. `studentName` is intentionally denormalized (matches the
 * frontend's flattened `ExamCandidate` type) so admin listing screens
 * don't need a join just to render a name.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS exam_candidates (
                id CHAR(36) PRIMARY KEY,
                studentId CHAR(36) NOT NULL,
                examId CHAR(36) NOT NULL,
                studentName VARCHAR(255),
                seatNo VARCHAR(20),
                admitCardStatus VARCHAR(20) DEFAULT 'pending',
                credentialStatus VARCHAR(20) DEFAULT 'pending',
                attendance VARCHAR(20) DEFAULT 'pending',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(studentId, examId),
                CONSTRAINT fk_exam_candidates_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
                CONSTRAINT fk_exam_candidates_exam FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_exam_candidates_examId ON exam_candidates(examId);
            CREATE INDEX idx_exam_candidates_studentId ON exam_candidates(studentId);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS exam_candidates;");
    },
];
