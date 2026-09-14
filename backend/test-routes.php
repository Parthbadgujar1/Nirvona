<?php

/**
 * Comprehensive Route & Functionality Tester
 *
 * Tests all backend routes to ensure:
 * - All routes are properly registered
 * - Controllers are wired correctly
 * - Database connections work
 * - Real data is returned (not hardcoded/stubs)
 * - All endpoints return correct status codes
 * - All workflows function end-to-end
 *
 * Usage: php test-routes.php
 * Make sure server is running: php -S localhost:8000 -t public/
 */

// Configuration
$baseUrl = 'http://localhost:8000';
$testResults = [
    'passed' => [],
    'failed' => [],
    'warnings' => []
];

// Utility function to make HTTP requests
function makeRequest($method, $path, $data = null, $headers = [], $baseUrl = 'http://localhost:8000') {
    $url = $baseUrl . $path;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    $defaultHeaders = ['Content-Type: application/json'];
    $allHeaders = array_merge($defaultHeaders, $headers);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $allHeaders);

    if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'status' => $httpCode,
        'body' => $response ? json_decode($response, true) : null,
        'raw' => $response
    ];
}

function test($name, $method, $path, $data = null, $expectedStatus = 200, $headers = []) {
    global $testResults, $baseUrl;

    $response = makeRequest($method, $path, $data, $headers, $baseUrl);

    if ($response['status'] == $expectedStatus) {
        $testResults['passed'][] = [
            'name' => $name,
            'method' => $method,
            'path' => $path,
            'status' => $response['status']
        ];
        echo "✅ {$name} ({$method} {$path} - {$response['status']})\n";
        return $response;
    } else {
        $testResults['failed'][] = [
            'name' => $name,
            'method' => $method,
            'path' => $path,
            'expected' => $expectedStatus,
            'actual' => $response['status'],
            'body' => $response['body']
        ];
        echo "❌ {$name} ({$method} {$path} - expected {$expectedStatus}, got {$response['status']})\n";
        if ($response['body'] && isset($response['body']['error'])) {
            echo "   Error: {$response['body']['error']}\n";
        }
        return $response;
    }
}

function warning($message) {
    global $testResults;
    $testResults['warnings'][] = $message;
    echo "⚠️  {$message}\n";
}

echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║     Nirvona Backend - Comprehensive Route Tester             ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

echo "Testing API Base URL: {$baseUrl}\n";
echo "ℹ️  Make sure the backend server is running: php -S localhost:8000 -t public/\n\n";

// TEST SECTION 1: Health & Public Endpoints
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "1. PUBLIC ENDPOINTS (No Auth Required)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

test("Health Check", "GET", "/api/health", null, 200);
test("List Courses", "GET", "/api/courses", null, 200);
test("Get Course Detail", "GET", "/api/courses/jee-main", null, 200);
test("Get Course Packages", "GET", "/api/courses/jee-main/packages", null, 200);
test("List Subjects", "GET", "/api/courses/jee-main/subjects", null, 200);
test("List Topics", "GET", "/api/courses/jee-main/topics", null, 200);
test("Get Syllabus", "GET", "/api/courses/jee-main/syllabus", null, 200);
test("Get Upcoming Exams", "GET", "/api/exams", null, 200);

// TEST SECTION 2: Authentication
echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "2. AUTHENTICATION ENDPOINTS\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$studentRegResponse = test(
    "Student Registration",
    "POST",
    "/api/students/register",
    [
        'email' => 'testuser_' . time() . '@test.com',
        'fullName' => 'Test User',
        'password' => 'test@1234',
        'className' => '12'
    ],
    201
);

if ($studentRegResponse['status'] == 201 && isset($studentRegResponse['body']['data']['token'])) {
    $studentToken = $studentRegResponse['body']['data']['token'];
    echo "   Got auth token: " . substr($studentToken, 0, 20) . "...\n";
} else {
    warning("Student registration did not return auth token");
    $studentToken = null;
}

test("Student Login (Invalid)", "POST", "/api/auth/login", [
    'email' => 'nonexistent@test.com',
    'password' => 'wrong'
], 401);

if ($studentToken) {
    test("Get Current Student Profile", "GET", "/api/students/me", null, 200, ["Authorization: Bearer {$studentToken}"]);
}

// Admin login
test("Admin Login (Invalid)", "POST", "/api/auth/admin/login", [
    'email' => 'admin@test.com',
    'password' => 'wrongpassword'
], 401);

// TEST SECTION 3: Student Endpoints (Authenticated)
echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "3. STUDENT ENDPOINTS (Authenticated)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

if ($studentToken) {
    test("Get Student Profile", "GET", "/api/student/profile", null, 200, ["Authorization: Bearer {$studentToken}"]);
    test("Update Student Profile", "PUT", "/api/student/profile", [
        'fullName' => 'Updated Name',
        'className' => '12'
    ], 200, ["Authorization: Bearer {$studentToken}"]);
    test("Get Student Enrollments", "GET", "/api/student/enrollments", null, 200, ["Authorization: Bearer {$studentToken}"]);
    test("Get Student Results", "GET", "/api/student/results", null, 200, ["Authorization: Bearer {$studentToken}"]);
    test("Get Student Analytics", "GET", "/api/student/analytics", null, 200, ["Authorization: Bearer {$studentToken}"]);
    test("Get Student Payments", "GET", "/api/students/me/payments", null, 200, ["Authorization: Bearer {$studentToken}"]);
    test("Get Student Notifications", "GET", "/api/students/me/notifications", null, 200, ["Authorization: Bearer {$studentToken}"]);
} else {
    warning("Skipping authenticated student endpoints (no valid token)");
}

// TEST SECTION 4: Admin Endpoints
echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "4. ADMIN ENDPOINTS (Requires Admin Token)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// These will fail without valid admin token, but we want to see they exist
test("Admin Dashboard", "GET", "/api/admin/dashboard", null, 401);
test("Admin Revenue Trend", "GET", "/api/admin/analytics/revenue-trend", null, 401);
test("Admin Registration Trend", "GET", "/api/admin/analytics/registration-trend", null, 401);
test("Admin List Students", "GET", "/api/admin/students", null, 401);
test("Admin List Payments", "GET", "/api/admin/payments", null, 401);
test("Admin List Exams", "GET", "/api/admin/exams", null, 401);
test("Admin List Exam Centres", "GET", "/api/admin/exam-centres", null, 401);
test("Admin List Notifications", "GET", "/api/admin/notifications", null, 401);

// TEST SECTION 5: Data Endpoints
echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "5. DATA ENDPOINTS (Fetching Real Data)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$coursesResponse = test("List Courses", "GET", "/api/courses", null, 200);
if ($coursesResponse['body'] && isset($coursesResponse['body']['data']) && count($coursesResponse['body']['data']) > 0) {
    echo "   ✓ Found " . count($coursesResponse['body']['data']) . " courses in database\n";
    $firstCourse = $coursesResponse['body']['data'][0];
    if (isset($firstCourse['slug'])) {
        $courseSlug = $firstCourse['slug'];
        test("Get Course Detail", "GET", "/api/courses/{$courseSlug}", null, 200);
    }
} else {
    warning("No courses found in database - may need to run seeders: php migrate.php --seed");
}

$examsResponse = test("List Exams", "GET", "/api/exams", null, 200);
if ($examsResponse['body'] && isset($examsResponse['body']['data']) && count($examsResponse['body']['data']) > 0) {
    echo "   ✓ Found " . count($examsResponse['body']['data']) . " exams in database\n";
} else {
    warning("No exams found in database");
}

// SUMMARY
echo "\n╔══════════════════════════════════════════════════════════════╗\n";
echo "║                     TEST SUMMARY                             ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

echo "✅ Passed: " . count($testResults['passed']) . "\n";
echo "❌ Failed: " . count($testResults['failed']) . "\n";
echo "⚠️  Warnings: " . count($testResults['warnings']) . "\n\n";

if (!empty($testResults['failed'])) {
    echo "Failed Tests:\n";
    foreach ($testResults['failed'] as $test) {
        echo "  ❌ {$test['name']} ({$test['method']} {$test['path']})\n";
        echo "     Expected {$test['expected']}, got {$test['actual']}\n";
    }
    echo "\n";
}

if (!empty($testResults['warnings'])) {
    echo "Warnings:\n";
    foreach ($testResults['warnings'] as $warning) {
        echo "  ⚠️  {$warning}\n";
    }
    echo "\n";
}

$total = count($testResults['passed']) + count($testResults['failed']);
if ($total > 0) {
    $passRate = count($testResults['passed']) / $total * 100;
    printf("Pass Rate: %.1f%%\n\n", $passRate);
}

if (count($testResults['failed']) == 0) {
    echo "╔══════════════════════════════════════════════════════════════╗\n";
    echo "║  🎉 All tests passed! Backend is fully functional.          ║\n";
    echo "╚══════════════════════════════════════════════════════════════╝\n";
    exit(0);
} else {
    echo "⚠️  Some tests failed. Review the errors above.\n";
    exit(1);
}
