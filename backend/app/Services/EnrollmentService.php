<?php

namespace Nirvona\Services;

use Nirvona\Repositories\EnrollmentRepository;
use Nirvona\Repositories\PackageRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * EnrollmentService
 *
 * Handles enrolling a student into a course after a successful
 * payment, with error isolation.
 */
class EnrollmentService extends BaseService
{
    private EnrollmentRepository $enrollmentRepository;
    private PackageRepository $packageRepository;

    public function __construct(
        EnrollmentRepository $enrollmentRepository,
        PackageRepository $packageRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->enrollmentRepository = $enrollmentRepository;
        $this->packageRepository = $packageRepository;
    }

    /**
     * Create an enrollment for a student who just purchased a package
     *
     * @param array $data studentId, courseSlug, packageId, paymentId
     * @return array
     */
    public function enroll(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $errors = $this->validate($data, [
                    'studentId' => ['required'],
                    'courseSlug' => ['required'],
                    'packageId' => ['required'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'EnrollmentService',
                        false
                    );
                }

                $package = $this->packageRepository->getById($data['packageId']);
                if (!$package) {
                    throw new ServiceException(
                        "Package not found: {$data['packageId']}",
                        'EnrollmentService',
                        false
                    );
                }

                $startDate = $data['startDate'] ?? date('Y-m-d');
                $endDate = $data['endDate'] ?? date(
                    'Y-m-d',
                    strtotime("+{$package['durationMonths']} months", strtotime($startDate))
                );

                $enrollment = $this->enrollmentRepository->create([
                    'studentId' => $data['studentId'],
                    'courseSlug' => $data['courseSlug'],
                    'packageId' => $data['packageId'],
                    'paymentId' => $data['paymentId'] ?? null,
                    'startDate' => $startDate,
                    'endDate' => $endDate,
                    'status' => 'active',
                    'testsTaken' => 0,
                    'testsTotal' => $package['tests'] ?? 0,
                ]);

                $this->auditLog('ENROLL', 'Enrollment', $enrollment['id'], [
                    'studentId' => $data['studentId'],
                    'courseSlug' => $data['courseSlug'],
                ]);

                return [
                    'success' => true,
                    'data' => $enrollment,
                    'message' => 'Enrollment created successfully',
                ];
            },
            null,
            'enroll'
        );
    }

    /**
     * Get a student's enrollments
     *
     * @param string $studentId
     * @return array
     */
    public function getByStudent(string $studentId): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->enrollmentRepository->getByStudent($studentId)],
            ['success' => true, 'data' => [], 'message' => 'Enrollments temporarily unavailable'],
            'getEnrollmentsByStudent'
        );
    }

    /**
     * List all enrollments, paginated (admin view)
     *
     * @param int $page
     * @param int $pageSize
     * @return array
     */
    public function listAll(int $page = 1, int $pageSize = 20): array
    {
        return $this->executeWithFallback(
            function () use ($page, $pageSize) {
                $offset = ($page - 1) * $pageSize;
                return [
                    'success' => true,
                    'data' => $this->enrollmentRepository->getAll($pageSize, $offset),
                    'meta' => [
                        'total' => $this->enrollmentRepository->count(),
                        'page' => $page,
                        'pageSize' => $pageSize,
                    ],
                ];
            },
            ['success' => true, 'data' => [], 'meta' => ['total' => 0, 'page' => $page, 'pageSize' => $pageSize]],
            'listAllEnrollments'
        );
    }
}
