<?php

namespace Nirvona\Repositories;

/**
 * CouponRepository
 *
 * Coupon usage is derived from payments (status = 'successful') rather than
 * stored in a counter, so it can never drift from the real purchases.
 */
class CouponRepository extends BaseRepository
{
    protected string $table = 'coupons';

    public function findByCode(string $code): ?array
    {
        return $this->selectOne("SELECT * FROM {$this->table} WHERE code = ? LIMIT 1", [$code]);
    }

    public function usageCount(string $code): int
    {
        $row = $this->selectOne(
            "SELECT COUNT(*)::int AS n FROM payments WHERE couponCode = ? AND status = 'successful'",
            [$code]
        );
        return (int) ($row['n'] ?? 0);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listWithUsage(): array
    {
        return $this->select(
            "SELECT c.*,
                    (SELECT COUNT(*)::int FROM payments p
                      WHERE p.couponCode = c.code AND p.status = 'successful') AS usedCount
             FROM {$this->table} c
             ORDER BY c.createdAt DESC, c.id"
        );
    }
}
