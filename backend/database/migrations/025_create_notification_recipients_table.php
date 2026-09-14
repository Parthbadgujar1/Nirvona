<?php

/**
 * Migration: Create Notification Recipients Table
 *
 * Per-student delivery + read-state for portal-channel notifications -
 * this is what powers a student's personal notification feed and the
 * unread badge in the portal shell. Only the "portal" channel fans out
 * here (WhatsApp/SMS/email are logged on the notification itself but
 * aren't something a student "reads" inside the app).
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            CREATE TABLE IF NOT EXISTS notification_recipients (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                notificationId UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
                studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                isRead BOOLEAN DEFAULT FALSE,
                readAt TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(notificationId, studentId)
            );

            CREATE INDEX idx_notification_recipients_studentId ON notification_recipients(studentId);
            CREATE INDEX idx_notification_recipients_notificationId ON notification_recipients(notificationId);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS notification_recipients CASCADE;");
    },
];
