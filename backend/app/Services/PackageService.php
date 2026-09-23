<?php

namespace Nirvona\Services;

use Nirvona\Repositories\PackageRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * PackageService
 *
 * Handles subscription/test-series package business logic with error
 * isolation.
 */
class PackageService extends BaseService
{
    private PackageRepository $packageRepository;

    public function __construct(
        PackageRepository $packageRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->packageRepository = $packageRepository;
    }

    /**
     * Get a package by ID
     *
     * @param string $id
     * @return array
     */
    public function getPackage(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                $package = $this->packageRepository->getById($id);

                // Retired packages 404 on the public site (they stay visible to
                // admins via the admin listing, which doesn't go through here).
                if (!$package || ($package['status'] ?? 'active') !== 'active') {
                    throw new ServiceException("Package not found: {$id}", 'PackageService', false);
                }

                return ['success' => true, 'data' => $package];
            },
            ['success' => false, 'error' => 'Unable to fetch package'],
            'getPackage'
        );
    }

    /**
     * List packages for a course
     *
     * @param string $courseSlug
     * @return array
     */
    public function getByCourse(string $courseSlug): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->packageRepository->getByCourse($courseSlug)],
            ['success' => true, 'data' => []],
            'getPackagesByCourse'
        );
    }

    /**
     * List every active package across every course - backs the public
     * /packages catalogue page (compare-all-programs view), which has
     * no single course to scope to.
     *
     * @return array
     */
    public function listAll(): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->packageRepository->getAllActive()],
            ['success' => true, 'data' => []],
            'listAllPackages'
        );
    }

    /**
     * List every package for admin management, including inactive ones
     *
     * @return array
     */
    public function listAllForAdmin(): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->packageRepository->getAllForAdmin()],
            ['success' => true, 'data' => []],
            'listAllPackagesForAdmin'
        );
    }

    /**
     * Create a package
     *
     * @param array $data
     * @return array
     */
    public function create(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $errors = $this->validate($data, [
                    'courseSlug' => ['required', 'string'],
                    'name' => ['required', 'string'],
                    'durationMonths' => ['required', 'numeric'],
                    'price' => ['required', 'numeric'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'PackageService',
                        false
                    );
                }

                $data = $this->normalizePricing($this->whitelist($data), null);
                $this->assertSellable($data + ['status' => 'active']);
                $package = $this->packageRepository->create($data);
                $this->auditLog('CREATE', 'Package', $package['id'], ['courseSlug' => $data['courseSlug']]);

                return ['success' => true, 'data' => $package, 'message' => 'Package created successfully'];
            },
            null,
            'createPackage'
        );
    }

    /**
     * Update a package
     *
     * @param string $id
     * @param array $data
     * @return array
     */
    public function update(string $id, array $data): array
    {
        return $this->executeWithFallback(
            function () use ($id, $data) {
                $existing = $this->packageRepository->getById($id);
                if (!$existing) {
                    throw new ServiceException("Package not found: {$id}", 'PackageService', false);
                }

                $data = $this->normalizePricing($this->whitelist($data), $existing);
                $this->assertSellable($data + $existing);
                $this->packageRepository->update($id, $data);
                $this->auditLog('UPDATE', 'Package', $id, ['fields' => array_keys($data)]);

                return [
                    'success' => true,
                    'data' => $this->packageRepository->getById($id),
                    'message' => 'Package updated successfully',
                ];
            },
            null,
            'updatePackage'
        );
    }

    /** Columns an admin may write; anything else in the request body is dropped. */
    private const WRITABLE = [
        'courseSlug', 'name', 'duration', 'durationLabel', 'durationMonths', 'price', 'originalPrice',
        'discountPercent', 'tests', 'recommended', 'tagline', 'features', 'benefits', 'includes',
        'status', 'tier',
    ];

    /** An active package must have a real price - nothing may be sold for free by accident. */
    private function assertSellable(array $final): void
    {
        if (($final['status'] ?? 'active') === 'active' && (float) ($final['price'] ?? 0) <= 0) {
            throw new ServiceException(
                'Set a price above zero before making this package active.',
                'PackageService',
                false
            );
        }
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function whitelist(array $data): array
    {
        return array_intersect_key($data, array_flip(self::WRITABLE));
    }

    /**
     * Keep price, original price and discount % consistent so the admin can
     * enter either the discount % or the discounted price:
     *  - percent given without a price  -> price = original x (1 - percent)
     *  - otherwise the percent is recomputed from the two prices
     *  - no original price -> no discount (percent 0)
     *
     * @param array<string, mixed> $data      incoming (whitelisted) fields
     * @param ?array<string, mixed> $existing current row when updating
     * @return array<string, mixed>
     */
    private function normalizePricing(array $data, ?array $existing): array
    {
        $touchesPricing = array_key_exists('price', $data)
            || array_key_exists('originalPrice', $data)
            || array_key_exists('discountPercent', $data);
        if (!$touchesPricing) {
            return $data;
        }

        $has = fn(string $k) => array_key_exists($k, $data);
        $original = $has('originalPrice') ? $data['originalPrice'] : ($existing['originalPrice'] ?? null);
        $original = ($original === null || $original === '') ? null : (float) $original;
        $price = $has('price') ? $data['price'] : ($existing['price'] ?? 0);
        $price = (float) $price;
        $percent = $has('discountPercent') ? $data['discountPercent'] : null;

        if ($price < 0 || ($original !== null && $original < 0)) {
            throw new ServiceException('Prices cannot be negative.', 'PackageService', false);
        }
        if ($original === null || $original == 0.0) {
            $data['originalPrice'] = null;
            $data['discountPercent'] = 0;
            return $data;
        }

        if ($percent !== null && $percent !== '' && !$has('price')) {
            if (!is_numeric($percent) || $percent < 0 || $percent > 100) {
                throw new ServiceException('Discount must be between 0 and 100 percent.', 'PackageService', false);
            }
            $price = round($original * (100 - (float) $percent) / 100, 2);
        }
        if ($price > $original) {
            throw new ServiceException(
                'The selling price cannot be higher than the original price.',
                'PackageService',
                false
            );
        }

        $data['originalPrice'] = $original;
        $data['price'] = $price;
        $data['discountPercent'] = (int) round(($original - $price) / $original * 100);
        return $data;
    }

    /**
     * Delete a package
     *
     * payments.packageId is ON DELETE SET NULL (021_add_foreign_key_constraints),
     * so a package that students have already purchased detaches from
     * their payment history instead of blocking the delete. Deactivating
     * (status='inactive' via update()) is the safer option for a package
     * with real purchase history - this is a hard delete.
     *
     * @param string $id
     * @return array
     */
    public function delete(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                if (!$this->packageRepository->getById($id)) {
                    throw new ServiceException("Package not found: {$id}", 'PackageService', false);
                }

                $this->packageRepository->delete($id);
                $this->auditLog('DELETE', 'Package', $id, []);

                return ['success' => true, 'message' => 'Package deleted successfully'];
            },
            null,
            'deletePackage'
        );
    }
}
