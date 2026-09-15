<?php

/**
 * Migration: Add Password to Students
 *
 * The students table had no way to authenticate a student at all -
 * AuthMiddleware existed but was never wired up, and there was nowhere
 * to check a login against. Nullable for now so existing rows (created
 * before this migration) aren't invalidated; StudentService requires it
 * on new registrations going forward.
 *
 * No "IF NOT EXISTS"/"IF EXISTS" here - unlike CREATE/DROP TABLE, MySQL
 * doesn't support that clause on ALTER TABLE ADD/DROP COLUMN at all
 * (a MariaDB-only extension). Safe regardless: the migration runner
 * tracks applied migrations and never re-runs this file.
 */
return [
    'up' => function (\PDO $pdo) {
        $pdo->exec("ALTER TABLE students ADD COLUMN passwordHash VARCHAR(255);");
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("ALTER TABLE students DROP COLUMN passwordHash;");
    },
];
