<?php

/**
 * Migration: Create Results Table
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS results (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                studentId UUID NOT NULL REFERENCES students(id),
                examId UUID NOT NULL REFERENCES exams(id),
                examName VARCHAR(255),
                courseSlug VARCHAR(100),
                score DECIMAL(10, 2),
                maxScore DECIMAL(10, 2),
                percentage DECIMAL(5, 2),
                rank INT,
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
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX idx_results_studentId ON results(studentId);
            CREATE INDEX idx_results_examId ON results(examId);
            CREATE INDEX idx_results_status ON results(status);
            CREATE INDEX idx_results_rank ON results(rank);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS results CASCADE;");
    },
];
