<?php

/**
 * Migration: Add notification preferences to students
 *
 * The student profile page's "Notification preferences" toggles were
 * local React state only - toggling one showed a success toast and was
 * forgotten on the next page load, because there was nowhere to store
 * it. Stored as JSONB (one row per student, four fixed channels)
 * rather than a separate table: it's always read and written as a
 * whole alongside the profile.
 *
 * `portal` is always true - exam/result notifications must reach the
 * student in-app regardless of what they choose for the other channels.
 */
return [
    'up' => function (\PDO $pdo) {
        $pdo->exec("
            ALTER TABLE students
            ADD COLUMN IF NOT EXISTS notificationPrefs JSONB NOT NULL
            DEFAULT '{\"whatsapp\": true, \"sms\": true, \"email\": true, \"portal\": true}'::jsonb;
        ");
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("ALTER TABLE students DROP COLUMN IF EXISTS notificationPrefs;");
    },
];
