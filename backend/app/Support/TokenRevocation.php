<?php

namespace Nirvona\Support;

use Nirvona\Config\Cache;

/**
 * Instant sign-out for an account.
 *
 * A JWT is valid until it expires (an hour by default), so deactivating a
 * student or changing a password would otherwise leave anyone already signed
 * in with full access for up to that long. A marker stored here makes
 * AuthMiddleware / AdminMiddleware refuse matching tokens:
 *
 *   - revoke():           every token for the account, including new ones,
 *                         until restore() (a deactivated student).
 *   - revokeIssuedBefore(): only tokens issued up to now - the person can sign
 *                         in again with the new password and get a valid token
 *                         (a password change/reset).
 *
 * The marker outlives the longest possible token, then disappears on its own.
 * Redis being unreachable never blocks a request (fails open) - the worst
 * case is the old behaviour of the token simply expiring.
 */
class TokenRevocation
{
    private static function key(string $userId): string
    {
        return 'revoked_user:' . $userId;
    }

    private static function ttl(): int
    {
        return max(3600, (int) ($_ENV['JWT_EXPIRATION'] ?? 3600)) + 60;
    }

    /** Block every token for this account until restore(). */
    public static function revoke(string $userId): void
    {
        self::store($userId, PHP_INT_MAX);
    }

    /** Invalidate tokens issued so far; a fresh sign-in afterwards works. */
    public static function revokeIssuedBefore(string $userId): void
    {
        self::store($userId, time());
    }

    public static function restore(string $userId): void
    {
        try {
            Cache::getRedis()->del([self::key($userId)]);
        } catch (\Throwable) {
        }
    }

    /** @param ?int $issuedAt the token's `iat` claim */
    public static function isRevoked(string $userId, ?int $issuedAt = null): bool
    {
        try {
            $marker = Cache::getRedis()->get(self::key($userId));
            if ($marker === null) {
                return false;
            }
            return $issuedAt === null || $issuedAt <= (int) $marker;
        } catch (\Throwable) {
            return false;
        }
    }

    private static function store(string $userId, int $value): void
    {
        try {
            Cache::getRedis()->setex(self::key($userId), self::ttl(), (string) $value);
        } catch (\Throwable) {
        }
    }
}
