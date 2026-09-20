<?php

/**
 * Set a new password for a student or admin account, from the command line.
 *
 *   php scripts/set-password.php admin  admin@nirvona.edu.in            # generates a strong random one
 *   php scripts/set-password.php admin  admin@nirvona.edu.in 'MyStr0ng!Passphrase'
 *   php scripts/set-password.php student aarav.sharma77@example.com
 *
 * Also ends every session the account already has (tokens issued before now
 * stop working; the person simply signs in again with the new password), so
 * anyone who signed in with the OLD password is cut off.
 *
 * Passwords must be at least 12 characters for admins and 8 for students,
 * with a capital letter and a digit. If you omit the password a strong random
 * one is generated and printed ONCE - store it in a password manager.
 */

require __DIR__ . '/../vendor/autoload.php';
(new Symfony\Component\Dotenv\Dotenv())->bootEnv(__DIR__ . '/../.env');

[$script, $kind, $email] = array_pad($argv, 3, null);
$password = $argv[3] ?? null;

if (!in_array($kind, ['admin', 'student'], true) || !$email) {
    fwrite(STDERR, "Usage: php scripts/set-password.php <admin|student> <email> [new-password]\n");
    exit(2);
}

$table = $kind === 'admin' ? 'admins' : 'students';
$minLength = $kind === 'admin' ? 12 : 8;
$generated = false;

if ($password === null) {
    // 16 chars, guaranteed to contain a capital letter and a digit.
    $alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
    do {
        $password = '';
        for ($i = 0; $i < 16; $i++) {
            $password .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
    } while (!preg_match('/[A-Z]/', $password) || !preg_match('/[0-9]/', $password));
    $generated = true;
}

if (strlen($password) < $minLength || !preg_match('/[A-Z]/', $password) || !preg_match('/[0-9]/', $password)) {
    fwrite(STDERR, "Password must be at least {$minLength} characters with a capital letter and a digit.\n");
    exit(2);
}

$pdo = Nirvona\Config\Database::getConnection();
$stmt = $pdo->prepare("SELECT id FROM {$table} WHERE lower(email) = lower(?)");
$stmt->execute([$email]);
$id = $stmt->fetchColumn();
if (!$id) {
    fwrite(STDERR, "No {$kind} account with that email.\n");
    exit(1);
}

$pdo->prepare("UPDATE {$table} SET passwordHash = ?, updatedAt = NOW() WHERE id = ?")
    ->execute([password_hash($password, PASSWORD_DEFAULT), $id]);

// Existing sessions for this account end now; signing in again works normally.
Nirvona\Support\TokenRevocation::revokeIssuedBefore((string) $id);

echo "Password updated for {$kind} {$email}. Existing sessions for this account were ended.\n";
if ($generated) {
    echo "New password (shown once): {$password}\n";
}
