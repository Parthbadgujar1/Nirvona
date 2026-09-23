<?php

/**
 * Security smoke test - tries to do things an attacker (or a curious user
 * editing URLs) would try, and reports any that WORK.
 *
 *   php scripts/security-smoke.php [base-url]        (default http://localhost:8000)
 *
 * It mints its own tokens from JWT_SECRET (so it needs the backend's .env),
 * touches no real data, and never calls the payment gateway. Exit code 1 if
 * any check fails.
 */

require __DIR__ . '/../vendor/autoload.php';
(new Symfony\Component\Dotenv\Dotenv())->bootEnv(__DIR__ . '/../.env');

use Nirvona\Services\JwtService;

$base = rtrim($argv[1] ?? 'http://localhost:8000', '/');
$jwt = new JwtService();
$pdo = Nirvona\Config\Database::getConnection();

$studentA = $pdo->query("SELECT id FROM students ORDER BY createdAt LIMIT 1")->fetchColumn();
$studentB = $pdo->query("SELECT id FROM students ORDER BY createdAt LIMIT 1 OFFSET 1")->fetchColumn();
$adminId = $pdo->query("SELECT id FROM admins LIMIT 1")->fetchColumn();
$tokenA = $jwt->issue($studentA, 'student');
$tokenAdmin = $jwt->issue($adminId, 'admin');

/** @return array{0:int,1:string,2:array<string,string>} */
function call(string $method, string $url, ?string $token = null, $body = null, array $headers = []): array
{
    $ch = curl_init($url);
    $h = ['Content-Type: application/json'];
    if ($token !== null) {
        $h[] = "Authorization: Bearer {$token}";
    }
    foreach ($headers as $k => $v) {
        $h[] = "{$k}: {$v}";
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true,
        CURLOPT_HTTPHEADER => $h, CURLOPT_TIMEOUT => 20,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, is_string($body) ? $body : json_encode($body));
    }
    $raw = (string) curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $size = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);
    $hdr = [];
    foreach (explode("\r\n", substr($raw, 0, $size)) as $line) {
        if (str_contains($line, ':')) {
            [$k, $v] = explode(':', $line, 2);
            $hdr[strtolower(trim($k))] = trim($v);
        }
    }
    return [$status, substr($raw, $size), $hdr];
}

$failed = 0;
function check(string $name, bool $ok, string $detail = ''): void
{
    global $failed;
    echo ($ok ? "  PASS  " : "  FAIL  ") . $name . ($ok ? '' : "  <-- {$detail}") . "\n";
    if (!$ok) {
        $failed++;
    }
}
function b64(string $s): string
{
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

echo "== 1. Data that used to be readable/writable with no login ==\n";
foreach ([
    ['GET', "/api/students/{$studentB}/payments"], ['GET', "/api/students/{$studentB}/results"],
    ['GET', "/api/students/{$studentB}/enrollments"], ['GET', "/api/students/{$studentB}/analytics"],
    ['GET', "/api/students/{$studentB}/admit-cards"], ['GET', "/api/students/{$studentB}/topic-performance"],
    ['GET', "/api/students/{$studentB}/exams/x/credential"], ['GET', "/api/students/{$studentB}/exams/x/responses"],
    ['GET', "/api/students/{$studentB}"], ['PUT', "/api/students/{$studentB}"],
    ['GET', '/api/payments/00000000-0000-0000-0000-000000000000'], ['GET', '/api/results/00000000-0000-0000-0000-000000000000'],
    ['GET', '/api/exams'], ['GET', '/api/exams/x'], ['GET', '/api/exams/x/stats'], ['GET', '/api/exams/x/leaderboard'],
    ['POST', '/api/exams'], ['POST', '/api/results'], ['POST', '/api/enrollments'],
] as [$m, $p]) {
    [$s, $b] = call($m, $base . $p, null, $m === 'GET' ? null : '{}');
    check("{$m} {$p} anonymous is refused (got {$s})", in_array($s, [401, 404, 405], true) && !str_contains($b, '"data":{'));
    // ... and even with a valid student login the id-in-URL routes must not exist
    [$s2] = call($m, $base . $p, $tokenA, $m === 'GET' ? null : '{}');
    check("{$m} {$p} as student A is refused (got {$s2})", in_array($s2, [401, 403, 404, 405], true));
}

echo "== 2. Login required ==\n";
foreach (['/api/students/me', '/api/students/me/payments', '/api/students/me/dashboard', '/api/student/results',
          '/api/exams/x/answer-key', '/api/auth/me', '/api/admin/dashboard', '/api/admin/students'] as $p) {
    [$s] = call('GET', $base . $p);
    check("GET {$p} without a token is 401 (got {$s})", $s === 401);
}

echo "== 3. A student token cannot use admin endpoints ==\n";
foreach ([['GET', '/api/admin/students'], ['GET', '/api/admin/payments'], ['POST', '/api/admin/packages'],
          ['DELETE', '/api/admin/courses/jee'], ['PUT', '/api/admin/students/' . $studentB],
          ['POST', '/api/admin/exams']] as [$m, $p]) {
    [$s] = call($m, $base . $p, $tokenA, $m === 'GET' || $m === 'DELETE' ? null : '{}');
    check("{$m} {$p} as student is 403 (got {$s})", $s === 403);
}

echo "== 4. Forged / tampered tokens ==\n";
$h = b64('{"typ":"JWT","alg":"HS256"}');
$p = b64(json_encode(['sub' => $adminId, 'role' => 'admin', 'iat' => time(), 'exp' => time() + 3600]));
$forged = [
    'signed with the old default secret' => "{$h}.{$p}." . b64(hash_hmac('sha256', "{$h}.{$p}", 'your-secret-key', true)),
    'alg=none' => b64('{"typ":"JWT","alg":"none"}') . ".{$p}.",
    'payload edited (student -> admin), old signature' => (function () use ($tokenA, $p) {
        [$hh, , $sig] = explode('.', $tokenA);
        return "{$hh}.{$p}.{$sig}";
    })(),
    'valid token with one byte appended' => (function () use ($adminId) {
        $c = (new JwtService())->issue($adminId, 'admin');
        [$hh, , $sig] = explode('.', $c);
        return $c;
    })() . 'x',
    'garbage' => 'not.a.token',
];
foreach ($forged as $label => $tok) {
    [$s] = call('GET', $base . '/api/admin/students', $tok);
    check("admin endpoint rejects token: {$label} (got {$s})", $s === 401);
}

echo "== 5. Injection through field names (admin write endpoints) ==\n";
foreach ([['PUT', '/api/admin/packages/' . '00000000-0000-0000-0000-000000000000'], ['POST', '/api/admin/packages']] as [$m, $path]) {
    [$s, $b] = call($m, $base . $path, $tokenAdmin, json_encode(["name = 'x', status" => 'inactive', 'courseSlug' => 'jee', 'name' => 'x', 'durationMonths' => 1, 'price' => 1]));
    check("{$m} {$path} with a crafted field name is refused, not executed (got {$s})", $s >= 400 && !str_contains($b, '"success":true'));
}

echo "== 6. Browsers: cross-origin and headers ==\n";
[$s] = call('GET', $base . '/api/packages', null, null, ['Origin' => 'https://evil.example']);
check("request from an untrusted origin is refused (got {$s})", $s === 403);
[$s, , $hd] = call('GET', $base . '/api/packages');
check('X-Content-Type-Options: nosniff', ($hd['x-content-type-options'] ?? '') === 'nosniff');
check('X-Frame-Options: DENY', ($hd['x-frame-options'] ?? '') === 'DENY');
check('no X-Powered-By header', !isset($hd['x-powered-by']));
[, , $hd] = call('GET', $base . '/api/students/me', $tokenA);
check('signed-in responses are not cacheable', str_contains($hd['cache-control'] ?? '', 'no-store'));
[$s] = call('POST', $base . '/api/students/register', null, str_repeat('a', 3 * 1024 * 1024));
check("oversized request body is refused (got {$s})", $s === 413);
[$s] = call('POST', $base . '/api/students/register', null, '{"fullName":"x"}', ['Content-Type' => 'text/plain']);
check("non-JSON content type is refused (got {$s})", $s === 400);

echo "== 7. Password guessing is throttled per account ==\n";
$email = 'smoke-' . bin2hex(random_bytes(4)) . '@example.com';
$codes = [];
for ($i = 0; $i < 13; $i++) {
    [$s] = call('POST', $base . '/api/auth/login', null, json_encode(['email' => $email, 'password' => 'wrong-' . $i]),
        ['X-Forwarded-For' => '203.0.113.' . $i]); // varying header must NOT dodge the limit
    $codes[] = $s;
}
check('login attempts on one account are cut off with 429 (' . implode(',', $codes) . ')', in_array(429, $codes, true));

echo "== 8. No account still uses a known default / demo password ==\n";
$known = ['demo1234', 'password123', 'Password123', 'Password@123', 'admin123', 'admin1234', 'Admin@123',
    'password', '12345678', 'test1234', 'Test@1234', 'nirvona123'];
foreach (['admins' => 'admin', 'students' => 'student'] as $table => $kind) {
    foreach ($pdo->query("SELECT email, passwordHash AS hash FROM {$table}")->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $weak = null;
        foreach ($known as $candidate) {
            if (password_verify($candidate, (string) $row['hash'])) {
                $weak = $candidate;
                break;
            }
        }
        check(
            "{$kind} {$row['email']} does not use a known default password",
            $weak === null,
            "guessable password - run: php scripts/set-password.php {$kind} {$row['email']}"
        );
    }
}

echo "== 9. Settings, coupons, change requests, schedule ==\n";
$adminOnly = [
    ['GET', '/api/admin/site-settings'], ['PUT', '/api/admin/site-settings'], ['PUT', '/api/admin/me/password'],
    ['GET', '/api/admin/coupons'], ['POST', '/api/admin/coupons'],
    ['PUT', '/api/admin/coupons/00000000-0000-0000-0000-000000000000'],
    ['DELETE', '/api/admin/coupons/00000000-0000-0000-0000-000000000000'],
    ['GET', '/api/admin/change-requests'],
    ['POST', '/api/admin/change-requests/00000000-0000-0000-0000-000000000000/approve'],
    ['POST', '/api/admin/change-requests/00000000-0000-0000-0000-000000000000/reject'],
];
foreach ($adminOnly as [$m, $p]) {
    $body = in_array($m, ['GET', 'DELETE'], true) ? null : '{}';
    [$sAnon] = call($m, $base . $p, null, $body);
    [$sStudent] = call($m, $base . $p, $tokenA, $body);
    check("{$m} {$p} anonymous is 401 (got {$sAnon})", $sAnon === 401);
    check("{$m} {$p} as student is 403 (got {$sStudent})", $sStudent === 403);
}
foreach (['/api/students/me/change-requests', '/api/students/me/test-schedule'] as $p) {
    [$s] = call('GET', $base . $p);
    check("GET {$p} without a token is 401 (got {$s})", $s === 401);
}
[$s] = call('POST', $base . '/api/students/me/payments/quote', null, '{}');
check("POST /api/students/me/payments/quote without a token is 401 (got {$s})", $s === 401);

// Students cannot edit their own profile any more (only notification prefs).
$before = $pdo->query("SELECT fullName FROM students WHERE id = " . $pdo->quote($studentA))->fetchColumn();
foreach (['PUT /api/students/me', 'PUT /api/student/profile'] as $route) {
    [$m, $p] = explode(' ', $route);
    [$s] = call($m, $base . $p, $tokenA, ['fullName' => 'Changed By Student', 'mobile' => '9999999999', 'status' => 'inactive']);
    check("{$route} with profile fields is refused (got {$s})", $s === 403);
}
$after = $pdo->query("SELECT fullName FROM students WHERE id = " . $pdo->quote($studentA))->fetchColumn();
check('student name was not changed by the refused edits', $before === $after);

// Change requests: only whitelisted fields, and never someone else's data.
[$s, $b] = call('POST', $base . '/api/students/me/change-requests', $tokenA, ['changes' => ['status' => 'active', 'passwordHash' => 'x']]);
check("change request for a non-whitelisted field is refused (got {$s})", $s === 400 && !str_contains($b, '"status":"pending"'));

// Public endpoints expose only what they should.
[$s, $b] = call('GET', $base . '/api/courses/11th-jee/schedule?tier=Basic');
check('public schedule works (got ' . $s . ')', $s === 200);
check('public schedule never exposes the source calendar dates', !preg_match('/pwdate/i', $b));
[$s, $b] = call('GET', $base . '/api/site-settings');
$keys = array_keys((json_decode($b, true)['data'] ?? []));
sort($keys);
check('public site-settings exposes only the contact fields', $keys === ['address', 'contactPersonName', 'email', 'gstin', 'orgName', 'phone', 'whatsapp']);
[$s, $b] = call('GET', $base . '/api/courses/11th-jee/schedule?tier=' . rawurlencode("Basic' OR '1'='1"));
check("schedule tier is validated, not injected (got {$s})", $s === 404 || $s === 400);

// Coupon guessing is throttled.
$codes = [];
for ($i = 0; $i < 24; $i++) {
    [$s] = call('POST', $base . '/api/students/me/payments/quote', $tokenA, ['packageId' => '00000000-0000-0000-0000-000000000000', 'couponCode' => "GUESS{$i}"]);
    $codes[] = $s;
}
check('coupon guessing is cut off with 429 (' . implode(',', array_unique($codes)) . ')', in_array(429, $codes, true));

echo "\n" . ($failed === 0 ? "ALL CHECKS PASSED" : "{$failed} CHECK(S) FAILED") . "\n";
exit($failed === 0 ? 0 : 1);
