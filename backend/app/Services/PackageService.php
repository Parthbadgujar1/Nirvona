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

                if (!$package) {
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
                if (!$this->packageRepository->getById($id)) {
                    throw new ServiceException("Package not found: {$id}", 'PackageService', false);
                }

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
