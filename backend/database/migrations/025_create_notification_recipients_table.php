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
                id CHAR(36) PRIMARY KEY,
                notificationId CHAR(36) NOT NULL,
                studentId CHAR(36) NOT NULL,
                isRead BOOLEAN DEFAULT FALSE,
                readAt TIMESTAMP NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(notificationId, studentId),
                CONSTRAINT fk_notification_recipients_notification FOREIGN KEY (notificationId) REFERENCES notifications(id) ON DELETE CASCADE,
                CONSTRAINT fk_notification_recipients_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE INDEX idx_notification_recipients_studentId ON notification_recipients(studentId);
            CREATE INDEX idx_notification_recipients_notificationId ON notification_recipients(notificationId);
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("DROP TABLE IF EXISTS notification_recipients;");
    },
];
