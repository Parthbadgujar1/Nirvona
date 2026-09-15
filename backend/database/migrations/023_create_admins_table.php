<?php

/**
 * Migration: Create Admins Table
 *
 * AdminController's docblock always claimed its routes "require admin
 * authentication", but there was no admin user concept anywhere in the
 * schema to back that claim - nothing could actually be authenticated
 * against. This table plus AuthService/AdminMiddleware is what makes
 * it real. Roles mirror the frontend's `Admin.role` union type.
 *
 * (The `role` column below was later found to be dead - nothing ever
 * actually gated on it, only the JWT's top-level "admin" vs "student"
 * claim did - and is dropped again in migration 028. Kept here so this
 * migration still reflects what was really created at the time; a
 * fresh database runs 023 then 028 in order, same as one that already
 * existed when 028 was written.)
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS admins (
                id CHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                passwordHash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'support',
                avatarUrl VARCHAR(500),
                status VARCHAR(20) DEFAULT 'active',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_admins_email ON admins(email);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS admins;");
    },
];
