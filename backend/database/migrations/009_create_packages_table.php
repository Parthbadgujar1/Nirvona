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
                id CHAR(36) PRIMARY KEY,
                courseSlug VARCHAR(50) NOT NULL,
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
                features JSON NULL,
                benefits JSON NULL,
                includes JSON NULL,
                status VARCHAR(20) DEFAULT 'active',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_packages_course FOREIGN KEY (courseSlug) REFERENCES courses(slug) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_packages_courseSlug ON packages(courseSlug);
            CREATE INDEX idx_packages_status ON packages(status);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS packages;");
    },
];
