<?php

/**
 * Migration: Drop the admins.role column
 *
 * Part of collapsing the admin account model to a single type (no
 * super-admin/exam-manager/support sub-roles). The column was never
 * actually enforced anywhere - AdminMiddleware only ever checked the
 * JWT's top-level `role` claim ("admin" vs "student"), never this
 * per-admin sub-role - so nothing depends on it besides the now-removed
 * dead code in Admin::isSuperAdmin() and AuthService's `adminRole`
 * JWT claim.
 */
return [
    'up' => function (\PDO $pdo) {
        $pdo->exec("ALTER TABLE admins DROP COLUMN IF EXISTS role;");
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("ALTER TABLE admins ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'admin';");
    },
];
