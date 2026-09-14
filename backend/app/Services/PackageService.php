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
}
