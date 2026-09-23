<?php

/**
 * Migration: site_settings
 *
 * Admin-editable organisation details (address, contact person, phone,
 * email...) that the public footer, contact page, student support page and
 * payment receipts all read. Before this the admin "Organisation" form
 * only pretended to save (a setTimeout), and those values were hardcoded
 * in five different frontend files.
 *
 * Simple key/value rows so a new field is a whitelist entry in
 * SiteSettingsService, not a schema change.
 */
return [
    'up' => function (\PDO $pdo) {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS site_settings (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT NOT NULL DEFAULT '',
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ");

        $defaults = [
            'orgName' => 'Nirvona Education Tech Pvt. Ltd.',
            'gstin' => '',
            'address' => "Chhatrapati Sambhajinagar, Maharashtra",
            'contactPersonName' => '',
            'phone' => '+91 77097 66717',
            'whatsapp' => '',
            'email' => 'support@nirvona.edu.in',
        ];
        $insert = $pdo->prepare(
            "INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO NOTHING"
        );
        foreach ($defaults as $key => $value) {
            $insert->execute([$key, $value]);
        }
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS site_settings;");
    },
];
