<?php

/**
 * Migration: Create Admit Cards Table
 *
 * Digital admit card records issued per student per exam.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS admit_cards (
                id CHAR(36) PRIMARY KEY,
                studentId CHAR(36) NOT NULL,
                examId CHAR(36) NOT NULL,
                rollNumber VARCHAR(50),
                seatNo VARCHAR(20),
                status VARCHAR(20) DEFAULT 'pending',
                generatedAt TIMESTAMP NULL,
                publishedAt TIMESTAMP NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(studentId, examId),
                CONSTRAINT fk_admit_cards_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
                CONSTRAINT fk_admit_cards_exam FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_admit_cards_examId ON admit_cards(examId);
            CREATE INDEX idx_admit_cards_studentId ON admit_cards(studentId);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS admit_cards;");
    },
];
