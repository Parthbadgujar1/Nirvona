<?php

/**
 * Migration: Create Admins Table
 *
 * AdminController's docblock always claimed its routes "require admin
 * authentication", but there was no admin user concept anywhere in the
 * schema to back that claim - nothing could actually be authenticated
 * against. This table plus AuthService/AdminMiddleware is what makes
 * it real. Roles mirror the frontend's `Admin.role` union type.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS admins (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                passwordHash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'support',
                avatarUrl VARCHAR(500),
                status VARCHAR(20) DEFAULT 'active',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX idx_admins_email ON admins(email);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS admins CASCADE;");
    },
];
