<?php

namespace Nirvona\Support;

use Nirvona\Config\Cache;

/**
 * Instant sign-out for a deactivated account.
 *
 * A JWT is valid until it expires (an hour by default), so deactivating a
 * student in the admin panel would otherwise leave anyone already signed in
 * with full access for up to that long. Deactivation drops a marker here;
 * AuthMiddleware refuses tokens for a marked account. The marker outlives
 * the longest possible token, then disappears on its own.
 *
 * Redis being unreachable never blocks a request (fails open) - the worst
 * case is the old behaviour of the token simply expiring.
 */
class TokenRevocation
{
    private static function key(string $userId): string
    {
        return 'revoked_user:' . $userId;
    }

    public static function revoke(string $userId): void
    {
        try {
            $ttl = max(3600, (int) ($_ENV['JWT_EXPIRATION'] ?? 3600)) + 60;
            Cache::getRedis()->setex(self::key($userId), $ttl, '1');
        } catch (\Throwable) {
        }
    }

    public static function restore(string $userId): void
    {
        try {
            Cache::getRedis()->del([self::key($userId)]);
        } catch (\Throwable) {
        }
    }

    public static function isRevoked(string $userId): bool
    {
        try {
            return (bool) Cache::getRedis()->exists(self::key($userId));
        } catch (\Throwable) {
            return false;
        }
    }
}
