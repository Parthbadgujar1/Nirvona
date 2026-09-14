<?php

/**
 * Migration: Create Packages Table
 *
 * Subscription/test-series plans a student can buy for a course.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS packages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                courseSlug VARCHAR(50) NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                duration VARCHAR(10) NOT NULL,
                durationLabel VARCHAR(50),
                durationMonths INT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                originalPrice DECIMAL(10, 2),
                discountPercent INT DEFAULT 0,
                tests INT DEFAULT 0,
                recommended BOOLEAN DEFAULT FALSE,
                tagline VARCHAR(500),
                features JSONB NOT NULL DEFAULT '[]',
                benefits JSONB NOT NULL DEFAULT '[]',
                includes JSONB NOT NULL DEFAULT '{}',
                status VARCHAR(20) DEFAULT 'active',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX idx_packages_courseSlug ON packages(courseSlug);
            CREATE INDEX idx_packages_status ON packages(status);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS packages CASCADE;");
    },
];
