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
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
                rollNumber VARCHAR(50),
                seatNo VARCHAR(20),
                status VARCHAR(20) DEFAULT 'pending',
                generatedAt TIMESTAMP,
                publishedAt TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(studentId, examId)
            );

            CREATE INDEX idx_admit_cards_examId ON admit_cards(examId);
            CREATE INDEX idx_admit_cards_studentId ON admit_cards(studentId);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS admit_cards CASCADE;");
    },
];
