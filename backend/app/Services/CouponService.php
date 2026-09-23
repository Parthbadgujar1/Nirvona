<?php

namespace Nirvona\Services;

use Nirvona\Repositories\CouponRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * CouponService
 *
 * Admin-managed discount codes. The admin creates a code with a percent and
 * hands it to a student personally; the student enters it at checkout for
 * that percent off on top of the package's own discount.
 *
 * Percent is limited to 1-99: a 100% coupon would produce a zero-value
 * order, which the payment gateway cannot process.
 */
class CouponService extends BaseService
{
    private CouponRepository $repository;

    public function __construct(
        CouponRepository $repository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->repository = $repository;
    }

    public static function normalizeCode(string $code): string
    {
        return strtoupper(trim($code));
    }

    /**
     * Check a code is currently usable and return it. Throws a
     * ServiceException with a student-safe message otherwise. Unknown and
     * deactivated codes share one message so codes cannot be probed.
     *
     * @return array<string, mixed>
     */
    public function resolve(string $code): array
    {
        $code = self::normalizeCode($code);
        $coupon = preg_match('/^[A-Z0-9_-]{3,40}$/', $code) ? $this->repository->findByCode($code) : null;

        if (!$coupon || ($coupon['status'] ?? '') !== 'active') {
            throw new ServiceException('This coupon code is not valid.', 'CouponService', false);
        }
        if (!empty($coupon['expiresAt']) && strtotime($coupon['expiresAt']) < time()) {
            throw new ServiceException('This coupon has expired.', 'CouponService', false);
        }
        if ($coupon['maxUses'] !== null && $this->repository->usageCount($code) >= (int) $coupon['maxUses']) {
            throw new ServiceException('This coupon has reached its usage limit.', 'CouponService', false);
        }
        return $coupon;
    }

    public function listForAdmin(): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->repository->listWithUsage()],
            ['success' => true, 'data' => []],
            'listCoupons'
        );
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $code = self::normalizeCode((string) ($data['code'] ?? ''));
                $fields = $this->validatedFields($data, true);
                if (!preg_match('/^[A-Z0-9_-]{3,40}$/', $code)) {
                    throw new ServiceException(
                        'Coupon code must be 3-40 characters: letters, numbers, - or _.',
                        'CouponService',
                        false
                    );
                }
                if ($this->repository->findByCode($code)) {
                    throw new ServiceException('A coupon with this code already exists.', 'CouponService', false);
                }

                $coupon = $this->repository->create(['code' => $code] + $fields);
                $this->auditLog('CREATE', 'Coupon', $coupon['id'], ['code' => $code, 'percent' => $fields['percent']]);
                return ['success' => true, 'data' => $coupon, 'message' => 'Coupon created'];
            },
            null,
            'createCoupon'
        );
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(string $id, array $data): array
    {
        return $this->executeWithFallback(
            function () use ($id, $data) {
                if (!$this->repository->getById($id)) {
                    throw new ServiceException("Coupon not found: {$id}", 'CouponService', false);
                }
                // The code itself never changes (it may already be with a student).
                $fields = $this->validatedFields($data, false);
                if (!empty($fields)) {
                    $this->repository->update($id, $fields);
                    $this->auditLog('UPDATE', 'Coupon', $id, ['fields' => array_keys($fields)]);
                }
                return ['success' => true, 'data' => $this->repository->getById($id), 'message' => 'Coupon updated'];
            },
            null,
            'updateCoupon'
        );
    }

    public function delete(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                if (!$this->repository->getById($id)) {
                    throw new ServiceException("Coupon not found: {$id}", 'CouponService', false);
                }
                $this->repository->delete($id);
                $this->auditLog('DELETE', 'Coupon', $id, []);
                return ['success' => true, 'message' => 'Coupon deleted'];
            },
            null,
            'deleteCoupon'
        );
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function validatedFields(array $data, bool $isCreate): array
    {
        $out = [];
        $errors = [];

        if ($isCreate || array_key_exists('percent', $data)) {
            $percent = $data['percent'] ?? null;
            if (!is_numeric($percent) || (int) $percent != $percent || $percent < 1 || $percent > 99) {
                $errors[] = 'Discount must be a whole number between 1 and 99.';
            } else {
                $out['percent'] = (int) $percent;
            }
        }
        if (array_key_exists('description', $data)) {
            $description = trim((string) $data['description']);
            if (mb_strlen($description) > 255) {
                $errors[] = 'Description must be at most 255 characters.';
            } else {
                $out['description'] = $description === '' ? null : $description;
            }
        }
        if (array_key_exists('status', $data)) {
            if (!in_array($data['status'], ['active', 'inactive'], true)) {
                $errors[] = 'Status must be active or inactive.';
            } else {
                $out['status'] = $data['status'];
            }
        }
        if (array_key_exists('maxUses', $data)) {
            $max = $data['maxUses'];
            if ($max === null || $max === '') {
                $out['maxUses'] = null;
            } elseif (!is_numeric($max) || (int) $max != $max || $max < 1 || $max > 1000000) {
                $errors[] = 'Usage limit must be a whole number of at least 1 (or blank for unlimited).';
            } else {
                $out['maxUses'] = (int) $max;
            }
        }
        if (array_key_exists('expiresAt', $data)) {
            $exp = $data['expiresAt'];
            if ($exp === null || $exp === '') {
                $out['expiresAt'] = null;
            } elseif (!is_string($exp) || strtotime($exp) === false) {
                $errors[] = 'Expiry date is invalid.';
            } else {
                // A date-only value means "valid through the end of that day".
                $out['expiresAt'] = preg_match('/^\d{4}-\d{2}-\d{2}$/', $exp)
                    ? $exp . ' 23:59:59'
                    : date('Y-m-d H:i:s', strtotime($exp));
            }
        }

        if (!empty($errors)) {
            throw new ServiceException(implode(' ', $errors), 'CouponService', false);
        }
        return $out;
    }
}
