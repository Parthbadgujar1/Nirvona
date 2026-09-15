<?php

/**
 * Migration: Create Results Table
 *
 * `rank` is backtick-quoted throughout - it became a reserved word in
 * MySQL 8.0.2+ (added for window functions like RANK()/DENSE_RANK())
 * and errors as a bare identifier. Every repository query against this
 * column (ResultRepository, StudentRepository) quotes it the same way.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS results (
                id CHAR(36) PRIMARY KEY,
                studentId CHAR(36) NOT NULL,
                examId CHAR(36) NOT NULL,
                examName VARCHAR(255),
                courseSlug VARCHAR(100),
                score DECIMAL(10, 2),
                maxScore DECIMAL(10, 2),
                percentage DECIMAL(5, 2),
                `rank` INT,
                totalCandidates INT,
                percentile DECIMAL(5, 2),
                accuracy DECIMAL(5, 2),
                correct INT,
                incorrect INT,
                unattempted INT,
                timeTakenMin INT,
                status VARCHAR(50) DEFAULT 'processing',
                topPerformerScore DECIMAL(10, 2),
                averageScore DECIMAL(10, 2),
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_results_student FOREIGN KEY (studentId) REFERENCES students(id),
                CONSTRAINT fk_results_exam FOREIGN KEY (examId) REFERENCES exams(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_results_studentId ON results(studentId);
            CREATE INDEX idx_results_examId ON results(examId);
            CREATE INDEX idx_results_status ON results(status);
            CREATE INDEX idx_results_rank ON results(`rank`);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS results;");
    },
];
