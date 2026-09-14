<?php

/**
 * Migration: Create Exams Table
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS exams (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                courseSlug VARCHAR(100),
                date TIMESTAMP NOT NULL,
                reportingTime VARCHAR(20),
                examTime VARCHAR(20),
                durationMinutes INT,
                totalQuestions INT,
                totalMarks INT,
                centreId UUID,
                status VARCHAR(50) DEFAULT 'draft',
                instructions TEXT,
                candidates INT DEFAULT 0,
                admitCardsGenerated INT DEFAULT 0,
                credentialsAssigned INT DEFAULT 0,
                syllabusScope TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX idx_exams_status ON exams(status);
            CREATE INDEX idx_exams_date ON exams(date);
            CREATE INDEX idx_exams_courseSlug ON exams(courseSlug);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS exams CASCADE;");
    },
];
