<?php

namespace Nirvona\Services;

use Nirvona\Repositories\CourseRepository;
use Nirvona\Repositories\PackageRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * CourseService
 *
 * Handles course catalogue business logic with error isolation.
 */
class CourseService extends BaseService
{
    private CourseRepository $courseRepository;
    private PackageRepository $packageRepository;

    public function __construct(
        CourseRepository $courseRepository,
        PackageRepository $packageRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->courseRepository = $courseRepository;
        $this->packageRepository = $packageRepository;
    }

    /**
     * List active courses
     *
     * @return array
     */
    public function listCourses(): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->courseRepository->getActive()],
            ['success' => true, 'data' => []],
            'listCourses'
        );
    }

    /**
     * Get a course by slug, including its subjects and packages
     *
     * @param string $slug
     * @return array
     */
    public function getCourse(string $slug): array
    {
        return $this->executeWithFallback(
            function () use ($slug) {
                $course = $this->courseRepository->findBySlug($slug);

                if (!$course) {
                    throw new ServiceException("Course not found: {$slug}", 'CourseService', false);
                }

                $course['subjects'] = $this->courseRepository->getSubjects($slug);

                return ['success' => true, 'data' => $course];
            },
            ['success' => false, 'error' => 'Unable to fetch course'],
            'getCourse'
        );
    }

    /**
     * Get packages available for a course
     *
     * @param string $slug
     * @return array
     */
    public function getPackagesForCourse(string $slug): array
    {
        // Delegates to PackageRepository rather than
        // CourseRepository::getPackages() (same query, kept for any
        // other callers) - that version skips PackageRepository's JSON
        // column decoding, so features/benefits/includes came back as
        // raw JSON strings instead of the array/object the frontend's
        // Package type expects.
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->packageRepository->getByCourse($slug)],
            ['success' => true, 'data' => []],
            'getPackagesForCourse'
        );
    }

    /**
     * Search courses
     *
     * @param string $query
     * @return array
     */
    public function search(string $query): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->courseRepository->search($query)],
            ['success' => true, 'data' => []],
            'searchCourses'
        );
    }
}
