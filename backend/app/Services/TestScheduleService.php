<?php

namespace Nirvona\Services;

use Nirvona\Repositories\TestScheduleRepository;
use Nirvona\Repositories\CourseRepository;
use Nirvona\Repositories\EnrollmentRepository;
use Nirvona\Repositories\PackageRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * TestScheduleService
 *
 * Serves the upcoming test calendar, publicly per course/plan and privately
 * per student. Both only ever return tests still to come: a student who
 * enrols late is never shown the tests already conducted.
 */
class TestScheduleService extends BaseService
{
    private const TIERS = ['Basic', 'Pro', 'Pro Max'];

    private TestScheduleRepository $repository;
    private CourseRepository $courseRepository;
    private EnrollmentRepository $enrollmentRepository;
    private PackageRepository $packageRepository;

    public function __construct(
        TestScheduleRepository $repository,
        CourseRepository $courseRepository,
        EnrollmentRepository $enrollmentRepository,
        PackageRepository $packageRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->repository = $repository;
        $this->courseRepository = $courseRepository;
        $this->enrollmentRepository = $enrollmentRepository;
        $this->packageRepository = $packageRepository;
    }

    /**
     * Public: upcoming tests of one plan of one (active) course.
     */
    public function forCourse(string $courseSlug, ?string $tier): array
    {
        return $this->executeWithFallback(
            function () use ($courseSlug, $tier) {
                $course = $this->courseRepository->findBySlug($courseSlug);
                if (!$course || ($course['status'] ?? 'active') !== 'active') {
                    throw new ServiceException("Course not found: {$courseSlug}", 'TestScheduleService', false);
                }
                $tiers = $this->repository->tiersWithUpcoming($courseSlug);
                usort($tiers, fn($a, $b) => array_search($a['tier'], self::TIERS) <=> array_search($b['tier'], self::TIERS));

                $tests = [];
                if ($tier !== null) {
                    if (!in_array($tier, self::TIERS, true)) {
                        throw new ServiceException('Unknown plan.', 'TestScheduleService', false);
                    }
                    $tests = $this->repository->upcoming($courseSlug, $tier);
                }
                return ['success' => true, 'data' => ['tiers' => $tiers, 'tier' => $tier, 'tests' => $tests]];
            },
            null,
            'testScheduleForCourse'
        );
    }

    /**
     * Student: upcoming tests for each of their active enrolments. The
     * student id comes from the verified JWT.
     */
    public function forStudent(string $studentId): array
    {
        return $this->executeWithFallback(
            function () use ($studentId) {
                $out = [];
                foreach ($this->enrollmentRepository->getByStudent($studentId) as $enrollment) {
                    if (($enrollment['status'] ?? '') !== 'active' || strtotime($enrollment['endDate']) < strtotime('today')) {
                        continue;
                    }
                    $package = $this->packageRepository->getById($enrollment['packageId']);
                    if (!$package || empty($package['tier'])) {
                        continue;
                    }
                    $out[] = [
                        'enrollmentId' => $enrollment['id'],
                        'courseSlug' => $enrollment['courseSlug'],
                        'courseName' => $enrollment['courseName'] ?? $enrollment['courseSlug'],
                        'packageName' => $enrollment['packageName'] ?? $package['name'],
                        'tier' => $package['tier'],
                        'tests' => $this->repository->upcoming($enrollment['courseSlug'], $package['tier']),
                    ];
                }
                return ['success' => true, 'data' => $out];
            },
            ['success' => true, 'data' => []],
            'testScheduleForStudent'
        );
    }
}
