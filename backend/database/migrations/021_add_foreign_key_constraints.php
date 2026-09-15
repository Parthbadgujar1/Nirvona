<?php

/**
 * Migration: Add Foreign Key Constraints
 *
 * The original 001-004 migrations created exams.centreId, exams.courseSlug,
 * payments.packageId, payments.courseSlug, and results.courseSlug as bare
 * columns because exam_centres, courses, and packages didn't exist yet.
 * Now that they do (005, 009, 011), tie them together with real FKs so
 * the database enforces referential integrity instead of relying on
 * application code alone.
 *
 * ON DELETE SET NULL everywhere: losing a course/centre/package should
 * never cascade-delete exams, payments, or results - it should just
 * orphan the reference.
 */
return [
    'up' => function (\PDO $pdo) {
        $sql = "
            ALTER TABLE exams
                ADD CONSTRAINT fk_exams_centre FOREIGN KEY (centreId)
                    REFERENCES exam_centres(id) ON DELETE SET NULL,
                ADD CONSTRAINT fk_exams_course FOREIGN KEY (courseSlug)
                    REFERENCES courses(slug) ON DELETE SET NULL;

            ALTER TABLE payments
                ADD CONSTRAINT fk_payments_package FOREIGN KEY (packageId)
                    REFERENCES packages(id) ON DELETE SET NULL,
                ADD CONSTRAINT fk_payments_course FOREIGN KEY (courseSlug)
                    REFERENCES courses(slug) ON DELETE SET NULL;

            ALTER TABLE results
                ADD CONSTRAINT fk_results_course FOREIGN KEY (courseSlug)
                    REFERENCES courses(slug) ON DELETE SET NULL;
        ";

        $pdo->exec($sql);
    },

    'down' => function (\PDO $pdo) {
        $sql = "
            ALTER TABLE exams
                DROP CONSTRAINT IF EXISTS fk_exams_centre,
                DROP CONSTRAINT IF EXISTS fk_exams_course;

            ALTER TABLE payments
                DROP CONSTRAINT IF EXISTS fk_payments_package,
                DROP CONSTRAINT IF EXISTS fk_payments_course;

            ALTER TABLE results
                DROP CONSTRAINT IF EXISTS fk_results_course;
        ";

        $pdo->exec($sql);
    },
];
