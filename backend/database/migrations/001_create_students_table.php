<?php

/**
 * Migration: Create Students Table
 *
 * Creates the students table with proper indexes.
 *
 * MySQL/MariaDB, not Postgres: id is CHAR(36) (a UUID string generated
 * in PHP by BaseRepository::create() - MySQL has no portable
 * function-default UUID across the MariaDB versions common on shared
 * hosting), and there's no `gen_random_uuid()` default.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS students (
                id CHAR(36) PRIMARY KEY,
                fullName VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                mobile VARCHAR(20),
                dateOfBirth DATE,
                gender VARCHAR(20),
                className VARCHAR(100),
                school VARCHAR(255),
                city VARCHAR(100),
                state VARCHAR(100),
                address TEXT,
                status VARCHAR(50) DEFAULT 'active',
                enrolledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                avatarUrl VARCHAR(500),
                guardianName VARCHAR(255),
                guardianMobile VARCHAR(20),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_students_email ON students(email);
            CREATE INDEX idx_students_status ON students(status);
            CREATE INDEX idx_students_className ON students(className);
            CREATE INDEX idx_students_city ON students(city);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS students;");
    },
];
