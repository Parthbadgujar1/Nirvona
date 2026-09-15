<?php

/**
 * Migration: Create Notifications Table
 *
 * One row per broadcast/announcement (a "send" of one message down one
 * channel to one audience) - matches the frontend's AppNotification
 * type and the admin notification log exactly. There was no backend
 * table at all for this: NotificationService only ever mocked sending
 * (email/SMS/WhatsApp/portal), nothing persisted, and
 * /api/admin/notifications + /api/students/me/notifications both 404'd.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS notifications (
                id CHAR(36) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'general',
                channel VARCHAR(20) NOT NULL,
                audience VARCHAR(255),
                recipientCount INT DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_notifications_status ON notifications(status);
            CREATE INDEX idx_notifications_channel ON notifications(channel);
            CREATE INDEX idx_notifications_createdAt ON notifications(createdAt);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS notifications;");
    },
];
