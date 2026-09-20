<?php

/**
 * Migration: Indexes for hundreds-to-thousands of concurrent students
 *
 * Every table already has an index on its main foreign key. What was
 * missing are the composite/partial indexes matching how the student
 * portal and the admin lists actually query - each of these is hit on
 * (nearly) every page a student opens:
 *
 *   payments (studentId, date DESC)       payment history, newest first
 *   payments (packageId)                  package -> sales counts, joins
 *   enrollments (studentId, courseSlug, status, endDate)
 *                                         "does this student have an active
 *                                         enrolment for this course?"
 *   enrollments (paymentId)               payment -> enrolment lookups
 *   notification_recipients (studentId) WHERE NOT isRead
 *                                         the unread-count badge polled by
 *                                         every open portal page
 *   notification_recipients (studentId, createdAt DESC)
 *   results (studentId, date DESC)        a student's result history
 *   results (examId, studentId)           "my result for this exam"
 *   exams (status, date)                  upcoming / completed exam lists
 *   students (status, className)          admin filters
 *
 * All IF NOT EXISTS, so re-running is harmless.
 */
return [
    'up' => function (\PDO $pdo) {
        $pdo->exec("
            CREATE INDEX IF NOT EXISTS idx_payments_student_date ON payments (studentId, date DESC);
            CREATE INDEX IF NOT EXISTS idx_payments_packageid ON payments (packageId);

            CREATE INDEX IF NOT EXISTS idx_enrollments_active_lookup
                ON enrollments (studentId, courseSlug, status, endDate);
            CREATE INDEX IF NOT EXISTS idx_enrollments_paymentid ON enrollments (paymentId);

            CREATE INDEX IF NOT EXISTS idx_notification_recipients_unread
                ON notification_recipients (studentId) WHERE isRead = FALSE;
            CREATE INDEX IF NOT EXISTS idx_notification_recipients_student_created
                ON notification_recipients (studentId, createdAt DESC);

            CREATE INDEX IF NOT EXISTS idx_results_student_date ON results (studentId, date DESC);
            CREATE INDEX IF NOT EXISTS idx_results_exam_student ON results (examId, studentId);

            CREATE INDEX IF NOT EXISTS idx_exams_status_date ON exams (status, date);
            CREATE INDEX IF NOT EXISTS idx_students_status_class ON students (status, className);
        ");
    },

    'down' => function (\PDO $pdo) {
        $pdo->exec("
            DROP INDEX IF EXISTS idx_payments_student_date;
            DROP INDEX IF EXISTS idx_payments_packageid;
            DROP INDEX IF EXISTS idx_enrollments_active_lookup;
            DROP INDEX IF EXISTS idx_enrollments_paymentid;
            DROP INDEX IF EXISTS idx_notification_recipients_unread;
            DROP INDEX IF EXISTS idx_notification_recipients_student_created;
            DROP INDEX IF EXISTS idx_results_student_date;
            DROP INDEX IF EXISTS idx_results_exam_student;
            DROP INDEX IF EXISTS idx_exams_status_date;
            DROP INDEX IF EXISTS idx_students_status_class;
        ");
    },
];
