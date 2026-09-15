<?php

use Ramsey\Uuid\Uuid;

/**
 * Simple Test Data Seeder
 *
 * Populates a login-able admin account and a few demo students for
 * local development/manual testing. Course/package catalogue data is
 * real already (see migration 027_seed_courses_and_packages.php) - this
 * seeder only adds accounts, not catalogue rows, to avoid creating a
 * second, conflicting set of course slugs.
 *
 * ids are generated here explicitly (Ramsey\Uuid, same as
 * BaseRepository::create()) - there's no DB-side default any more
 * (MySQL has no portable function-default UUID the way Postgres's
 * gen_random_uuid() was), so a raw INSERT like this one has to supply
 * its own id or the NOT NULL primary key insert fails outright.
 */
return [
    'up' => function (\PDO $pdo) {
        // Check if already seeded
        $count = $pdo->query("SELECT COUNT(*) as cnt FROM students")->fetch()['cnt'];
        if ($count > 0) {
            echo "✓ Test data already exists\n";
            return;
        }

        echo "Seeding test data...\n";

        // 1. Admin
        $pdo->prepare("
            INSERT INTO admins (id, email, name, passwordHash, status)
            VALUES (?, ?, ?, ?, ?)
        ")->execute([
            Uuid::uuid4()->toString(),
            'admin@nirvona.test',
            'Admin User',
            password_hash('admin123456', PASSWORD_BCRYPT),
            'active',
        ]);
        echo "✓ Admin created (admin@nirvona.test / admin123456)\n";

        // 2. Test Students - className must match a real course's
        // audience (Class 11/12), matching the seeded course catalogue.
        $students = [
            ['email' => 'student1@test.com', 'fullName' => 'Student One', 'className' => 'Class 12'],
            ['email' => 'student2@test.com', 'fullName' => 'Student Two', 'className' => 'Class 12'],
            ['email' => 'student3@test.com', 'fullName' => 'Student Three', 'className' => 'Class 11'],
        ];

        foreach ($students as $student) {
            $pdo->prepare("
                INSERT INTO students (id, email, fullName, className, passwordHash, status)
                VALUES (?, ?, ?, ?, ?, ?)
            ")->execute([
                Uuid::uuid4()->toString(),
                $student['email'],
                $student['fullName'],
                $student['className'],
                password_hash('password123', PASSWORD_BCRYPT),
                'active',
            ]);
        }
        echo "✓ " . count($students) . " students created (password123)\n";

        echo "✅ Test data seeding complete!\n";
    },

    'down' => function (\PDO $pdo) {
        echo "⚠️  Seeding is one-way - not reverting\n";
    },
];
