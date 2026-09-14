<?php

/**
 * Simple Test Data Seeder
 *
 * Populates minimum test data matching actual schema
 */

return [
    'up' => function(\PDO $pdo) {
        // Check if already seeded
        $count = $pdo->query("SELECT COUNT(*) as cnt FROM students")->fetch()['cnt'];
        if ($count > 0) {
            echo "✓ Test data already exists\n";
            return;
        }

        echo "Seeding test data...\n";

        // 1. Admin
        $pdo->prepare("
            INSERT INTO admins (email, name, passwordhash, role, status)
            VALUES (?, ?, ?, ?, ?)
        ")->execute([
            'admin@nirvona.test',
            'Admin User',
            password_hash('admin123456', PASSWORD_BCRYPT),
            'admin',
            'active'
        ]);
        echo "✓ Admin created\n";

        // 2. Courses (if not exist)
        $courseCount = $pdo->query("SELECT COUNT(*) as cnt FROM courses")->fetch()['cnt'];
        if ($courseCount == 0) {
            $pdo->prepare("INSERT INTO courses (slug, name) VALUES (?, ?)")->execute(['jee-main', 'JEE Main']);
            $pdo->prepare("INSERT INTO courses (slug, name) VALUES (?, ?)")->execute(['neet', 'NEET']);
            $pdo->prepare("INSERT INTO courses (slug, name) VALUES (?, ?)")->execute(['boards', 'CBSE Class 12']);
            echo "✓ Courses created\n";
        }

        // 3. Test Students
        $students = [
            ['email' => 'student1@test.com', 'fullname' => 'Student One', 'classname' => '12'],
            ['email' => 'student2@test.com', 'fullname' => 'Student Two', 'classname' => '12'],
            ['email' => 'student3@test.com', 'fullname' => 'Student Three', 'classname' => '11'],
        ];

        foreach ($students as $student) {
            $pdo->prepare("
                INSERT INTO students (email, fullname, classname, passwordhash, status)
                VALUES (?, ?, ?, ?, ?)
            ")->execute([
                $student['email'],
                $student['fullname'],
                $student['classname'],
                password_hash('password123', PASSWORD_BCRYPT),
                'active'
            ]);
        }
        echo "✓ " . count($students) . " students created\n";

        echo "✅ Test data seeding complete!\n";
    },

    'down' => function(\PDO $pdo) {
        echo "⚠️  Seeding is one-way - not reverting\n";
    }
];
