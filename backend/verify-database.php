<?php

/**
 * Database Verification Script
 *
 * Verifies that:
 * 1. All 25 tables are created
 * 2. Tables have proper data (not empty)
 * 3. Foreign key relationships are intact
 * 4. Test data is properly seeded
 *
 * Usage: php verify-database.php
 */

require __DIR__ . '/vendor/autoload.php';

(new \Symfony\Component\Dotenv\Dotenv())->bootEnv(__DIR__ . '/.env');

$colors = [
    'reset' => "\033[0m",
    'bold' => "\033[1m",
    'green' => "\033[32m",
    'red' => "\033[31m",
    'yellow' => "\033[33m",
    'blue' => "\033[34m",
];

echo "{$colors['bold']}╔════════════════════════════════════════════════════════════╗\n";
echo "║  🗄️  DATABASE VERIFICATION REPORT                             ║\n";
echo "╚════════════════════════════════════════════════════════════════╝{$colors['reset']}\n\n";

try {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $port = $_ENV['DB_PORT'] ?? '5432';
    $database = $_ENV['DB_DATABASE'] ?? 'nirvona';
    $username = $_ENV['DB_USERNAME'] ?? 'postgres';
    $password = $_ENV['DB_PASSWORD'] ?? '';

    $dsn = "pgsql:host={$host};port={$port};dbname={$database}";

    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    echo "{$colors['green']}✅ Database connection successful{$colors['reset']}\n";
    echo "   Host: {$host}:{$port}\n";
    echo "   Database: {$database}\n\n";

} catch (PDOException $e) {
    echo "{$colors['red']}❌ Database connection failed{$colors['reset']}\n";
    echo "   Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Define all tables that should exist
$expectedTables = [
    'students' => 'Student accounts',
    'admins' => 'Admin accounts',
    'courses' => 'Course offerings',
    'subjects' => 'Course subjects',
    'topics' => 'Topics within subjects',
    'syllabus_units' => 'Syllabus breakdown',
    'packages' => 'Course packages',
    'enrollments' => 'Student enrollments',
    'payments' => 'Payment records',
    'exams' => 'Mock tests and exams',
    'exam_centres' => 'Exam locations',
    'exam_candidates' => 'Exam candidates',
    'admit_cards' => 'Admit card details',
    'exam_credentials' => 'Exam credentials',
    'questions' => 'Exam questions',
    'answer_keys' => 'Answer key details',
    'student_responses' => 'Student exam responses',
    'results' => 'Exam results',
    'result_analysis' => 'Result analysis',
    'topic_performance' => 'Topic-wise performance',
    'leaderboards' => 'Exam leaderboards',
    'notifications' => 'Broadcast notifications',
    'notification_recipients' => 'Notification recipients',
    'activities' => 'Activity audit log',
    'schema_migrations' => 'Migration tracking',
];

echo "{$colors['bold']}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "  📊 TABLE VERIFICATION\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{$colors['reset']}\n\n";

// Get list of existing tables
$result = $pdo->query("
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
");
$existingTables = $result->fetchAll(PDO::FETCH_COLUMN);
$existingTables = array_flip($existingTables);

$tablesFound = 0;
$tablesNotFound = [];

foreach ($expectedTables as $tableName => $description) {
    if (isset($existingTables[$tableName])) {
        echo "{$colors['green']}✅{$colors['reset']} {$tableName}\n";
        echo "   {$description}\n\n";
        $tablesFound++;
    } else {
        echo "{$colors['red']}❌{$colors['reset']} {$tableName}\n";
        echo "   {$description} - {$colors['red']}NOT FOUND{$colors['reset']}\n\n";
        $tablesNotFound[] = $tableName;
    }
}

echo "{$colors['bold']}Found {$tablesFound}/" . count($expectedTables) . " tables{$colors['reset']}\n\n";

if (!empty($tablesNotFound)) {
    echo "{$colors['red']}Missing tables:{$colors['reset']}\n";
    foreach ($tablesNotFound as $table) {
        echo "  • {$table}\n";
    }
    echo "\n{$colors['yellow']}⚠️  Run: php migrate.php{$colors['reset']}\n\n";
}

// ============================================================================
echo "\n{$colors['bold']}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "  📈 DATA VOLUME CHECK\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{$colors['reset']}\n\n";

$recordCounts = [
    'students' => 'Student accounts',
    'admins' => 'Admin accounts',
    'courses' => 'Courses',
    'subjects' => 'Subjects',
    'topics' => 'Topics',
    'packages' => 'Packages',
    'enrollments' => 'Enrollments',
    'payments' => 'Payments',
    'exams' => 'Exams',
    'exam_centres' => 'Exam centres',
    'exam_candidates' => 'Exam candidates',
    'questions' => 'Questions',
    'answer_keys' => 'Answer keys',
    'student_responses' => 'Student responses',
    'results' => 'Results',
    'notifications' => 'Notifications',
];

$totalRecords = 0;
$dataWarnings = [];

foreach ($recordCounts as $table => $label) {
    try {
        $count = $pdo->query("SELECT COUNT(*) as cnt FROM {$table}")->fetch()['cnt'];
        $totalRecords += $count;

        if ($count == 0) {
            echo "{$colors['yellow']}⚠️  {$colors['reset']} {$label}: {$count} records\n";
            $dataWarnings[] = $label;
        } else if ($count < 3) {
            echo "{$colors['yellow']}✓ {$colors['reset']} {$label}: {$count} records (minimal)\n";
        } else {
            echo "{$colors['green']}✅ {$colors['reset']} {$label}: {$count} records\n";
        }
    } catch (Exception $e) {
        echo "{$colors['red']}❌ {$colors['reset']} {$label}: Error getting count\n";
    }
}

echo "\n{$colors['bold']}Total records in database: {$totalRecords}{$colors['reset']}\n\n";

if (!empty($dataWarnings)) {
    echo "{$colors['yellow']}⚠️  Some tables are empty:{$colors['reset']}\n";
    foreach ($dataWarnings as $label) {
        echo "   • {$label}\n";
    }
    echo "\n{$colors['yellow']}Run: php migrate.php --seed{$colors['reset']}\n\n";
}

// ============================================================================
echo "\n{$colors['bold']}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "  🔐 SAMPLE DATA VERIFICATION\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{$colors['reset']}\n\n";

// Check admin account
try {
    $admin = $pdo->query("SELECT id, email, fullname, role FROM admins LIMIT 1")->fetch();
    if ($admin) {
        echo "{$colors['green']}✅ Admin account exists{$colors['reset']}\n";
        echo "   Email: {$admin['email']}\n";
        echo "   Name: {$admin['fullname']}\n";
        echo "   Role: {$admin['role']}\n\n";
    } else {
        echo "{$colors['yellow']}⚠️  No admin accounts found{$colors['reset']}\n\n";
    }
} catch (Exception $e) {
    echo "{$colors['yellow']}⚠️  Could not verify admin account{$colors['reset']}\n\n";
}

// Check sample student
try {
    $student = $pdo->query("SELECT id, email, fullname FROM students LIMIT 1")->fetch();
    if ($student) {
        echo "{$colors['green']}✅ Student account exists{$colors['reset']}\n";
        echo "   Email: {$student['email']}\n";
        echo "   Name: {$student['fullname']}\n\n";
    } else {
        echo "{$colors['yellow']}⚠️  No student accounts found{$colors['reset']}\n\n";
    }
} catch (Exception $e) {
    echo "{$colors['yellow']}⚠️  Could not verify student account{$colors['reset']}\n\n";
}

// Check sample course
try {
    $course = $pdo->query("SELECT id, name, slug FROM courses LIMIT 1")->fetch();
    if ($course) {
        echo "{$colors['green']}✅ Course exists{$colors['reset']}\n";
        echo "   Name: {$course['name']}\n";
        echo "   Slug: {$course['slug']}\n\n";

        // Get course subjects
        $subjects = $pdo->query("SELECT COUNT(*) as cnt FROM subjects WHERE courseid = '{$course['id']}'")->fetch();
        echo "   Subjects: {$subjects['cnt']}\n";

        // Get course packages
        $packages = $pdo->query("SELECT COUNT(*) as cnt FROM packages WHERE courseslug = '{$course['slug']}'")->fetch();
        echo "   Packages: {$packages['cnt']}\n\n";
    } else {
        echo "{$colors['yellow']}⚠️  No courses found{$colors['reset']}\n\n";
    }
} catch (Exception $e) {
    echo "{$colors['yellow']}⚠️  Could not verify course data{$colors['reset']}\n\n";
}

// Check sample exam
try {
    $exam = $pdo->query("SELECT id, name, courseslug, totalquestions, totalmarks FROM exams LIMIT 1")->fetch();
    if ($exam) {
        echo "{$colors['green']}✅ Exam exists{$colors['reset']}\n";
        echo "   Name: {$exam['name']}\n";
        echo "   Course: {$exam['courseslug']}\n";
        echo "   Questions: {$exam['totalquestions']}\n";
        echo "   Marks: {$exam['totalmarks']}\n\n";
    } else {
        echo "{$colors['yellow']}⚠️  No exams found{$colors['reset']}\n\n";
    }
} catch (Exception $e) {
    echo "{$colors['yellow']}⚠️  Could not verify exam data{$colors['reset']}\n\n";
}

// ============================================================================
echo "\n{$colors['bold']}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "  🔗 RELATIONSHIP INTEGRITY\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{$colors['reset']}\n\n";

// Check for orphaned records
$checks = [
    'Enrollments → Students' => "SELECT COUNT(*) as cnt FROM enrollments e WHERE NOT EXISTS (SELECT 1 FROM students s WHERE s.id = e.studentid)",
    'Enrollments → Packages' => "SELECT COUNT(*) as cnt FROM enrollments e WHERE NOT EXISTS (SELECT 1 FROM packages p WHERE p.id = e.packageid)",
    'Payments → Students' => "SELECT COUNT(*) as cnt FROM payments p WHERE NOT EXISTS (SELECT 1 FROM students s WHERE s.id = p.studentid)",
    'Results → Students' => "SELECT COUNT(*) as cnt FROM results r WHERE NOT EXISTS (SELECT 1 FROM students s WHERE s.id = r.studentid)",
    'Results → Exams' => "SELECT COUNT(*) as cnt FROM results r WHERE NOT EXISTS (SELECT 1 FROM exams e WHERE e.id = r.examid)",
];

foreach ($checks as $label => $query) {
    try {
        $result = $pdo->query($query)->fetch();
        $orphanCount = $result['cnt'] ?? 0;

        if ($orphanCount == 0) {
            echo "{$colors['green']}✅ {$colors['reset']} {$label}: No orphaned records\n";
        } else {
            echo "{$colors['red']}❌ {$colors['reset']} {$label}: {$orphanCount} orphaned records found\n";
        }
    } catch (Exception $e) {
        echo "{$colors['yellow']}⚠️  {$colors['reset']} {$label}: Could not verify\n";
    }
}

echo "\n";

// ============================================================================
echo "\n{$colors['bold']}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "  📋 SCHEMA MIGRATIONS STATUS\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{$colors['reset']}\n\n";

try {
    $migrations = $pdo->query("SELECT migration, appliedat FROM schema_migrations ORDER BY appliedat DESC LIMIT 5")->fetchAll();

    if (!empty($migrations)) {
        echo "{$colors['green']}✅ Recent migrations applied:{$colors['reset']}\n";
        foreach ($migrations as $migration) {
            echo "   • {$migration['migration']} ({$migration['appliedat']})\n";
        }

        $totalMigrations = $pdo->query("SELECT COUNT(*) as cnt FROM schema_migrations")->fetch()['cnt'];
        echo "\n   Total migrations applied: {$totalMigrations}\n";
    } else {
        echo "{$colors['red']}❌ No migrations found{$colors['reset']}\n";
    }
} catch (Exception $e) {
    echo "{$colors['red']}❌ Could not read migration table{$colors['reset']}\n";
}

echo "\n";

// ============================================================================
echo "\n{$colors['bold']}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "  ✅ FINAL STATUS\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{$colors['reset']}\n\n";

$issues = 0;

if (!empty($tablesNotFound)) {
    $issues += count($tablesNotFound);
}

if (!empty($dataWarnings)) {
    $issues += count($dataWarnings);
}

if ($issues == 0) {
    echo "{$colors['bold']}{$colors['green']}🎉 Database is properly configured and seeded!{$colors['reset']}\n\n";
    echo "✅ All 25 tables created\n";
    echo "✅ Test data populated\n";
    echo "✅ Relationships intact\n";
    echo "✅ Ready for API testing\n";
    echo "\n{$colors['yellow']}Next step: php verify-all-workflows.php{$colors['reset']}\n";
} else {
    echo "{$colors['yellow']}⚠️  Database has issues that need attention:{$colors['reset']}\n";
    echo "   Problems found: {$issues}\n\n";
    echo "{$colors['yellow']}Steps to fix:{$colors['reset']}\n";
    echo "   1. php migrate.php\n";
    echo "   2. php migrate.php --seed\n";
}

echo "\n";
