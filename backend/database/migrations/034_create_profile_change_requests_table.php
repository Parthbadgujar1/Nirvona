<?php

/**
 * Migration: profile_change_requests
 *
 * Students can no longer edit their own profile (name, gender, mobile...).
 * They ask an admin instead: `changes` is a JSON object of
 * { field: requestedNewValue }, `reason` is their explanation. An admin
 * approves (the change is applied through the normal validated profile
 * update) or rejects with a note.
 */
return [
    'up' => function (\PDO $pdo) {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS profile_change_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                changes JSONB NOT NULL DEFAULT '{}',
                reason VARCHAR(1000),
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                adminNote VARCHAR(1000),
                resolvedAt TIMESTAMP,
                resolvedBy UUID,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_pcr_studentId ON profile_change_requests(studentId);
            CREATE INDEX IF NOT EXISTS idx_pcr_status ON profile_change_requests(status);
        ");
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS profile_change_requests;");
    },
];
