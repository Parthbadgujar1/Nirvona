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
            function () {
                // Public course cards show a subject count/list (see
                // CourseCard, the /courses comparison table) - subjects
                // live in a separate table, so a plain SELECT * on courses
                // misses them entirely without this, same as the admin
                // listing (listAllForAdmin()) needed.
                $courses = $this->courseRepository->getActive();
                foreach ($courses as &$course) {
                    $course['subjects'] = $this->courseRepository->getSubjects($course['slug']);
                }
                return ['success' => true, 'data' => $courses];
            },
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
     * List every course for admin management, including inactive ones.
     *
     * Attaches `subjects` per course the same way getCourse() does for a
     * single course - the admin course cards render subject badges, and
     * without this every course would show none (subjects live in a
     * separate table, not a courses column, so a plain SELECT * misses
     * them entirely).
     *
     * @return array
     */
    public function listAllForAdmin(): array
    {
        return $this->executeWithFallback(
            function () {
                $courses = $this->courseRepository->getAllForAdmin();
                foreach ($courses as &$course) {
                    $course['subjects'] = $this->courseRepository->getSubjects($course['slug']);
                }
                return ['success' => true, 'data' => $courses];
            },
            ['success' => true, 'data' => []],
            'listAllCoursesForAdmin'
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

    /**
     * Create a course
     *
     * @param array $data
     * @return array
     */
    public function create(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $errors = $this->validate($data, [
                    'slug' => ['required', 'string'],
                    'name' => ['required', 'string'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'CourseService',
                        false
                    );
                }

                if ($this->courseRepository->findBySlug($data['slug'])) {
                    throw new ServiceException(
                        "Course slug already in use: {$data['slug']}",
                        'CourseService',
                        false
                    );
                }

                $course = $this->courseRepository->create($data);
                $this->auditLog('CREATE', 'Course', $course['slug'], ['slug' => $data['slug']]);

                return ['success' => true, 'data' => $course, 'message' => 'Course created successfully'];
            },
            null,
            'createCourse'
        );
    }

    /**
     * Update a course
     *
     * @param string $slug
     * @param array $data
     * @return array
     */
    public function update(string $slug, array $data): array
    {
        return $this->executeWithFallback(
            function () use ($slug, $data) {
                if (!$this->courseRepository->findBySlug($slug)) {
                    throw new ServiceException("Course not found: {$slug}", 'CourseService', false);
                }

                // slug is the primary key and a foreign key throughout the
                // app (exams.courseSlug, payments.courseSlug, ...) - it's
                // never mutable after creation, unlike every other field.
                unset($data['slug']);

                $this->courseRepository->update($slug, $data);
                $this->auditLog('UPDATE', 'Course', $slug, ['fields' => array_keys($data)]);

                return [
                    'success' => true,
                    'data' => $this->courseRepository->findBySlug($slug),
                    'message' => 'Course updated successfully',
                ];
            },
            null,
            'updateCourse'
        );
    }

    /**
     * Delete a course
     *
     * Refuses when packages still exist under this course - packages.courseSlug
     * is ON DELETE CASCADE (009_create_packages_table), so deleting a course
     * with packages would silently wipe out every package (and, transitively,
     * anyone's purchase history referencing them) instead of failing loudly.
     * Exams/payments/results reference courseSlug ON DELETE SET NULL and are
     * safe either way, so only packages need checking.
     *
     * @param string $slug
     * @return array
     */
    public function delete(string $slug): array
    {
        return $this->executeWithFallback(
            function () use ($slug) {
                if (!$this->courseRepository->findBySlug($slug)) {
                    throw new ServiceException("Course not found: {$slug}", 'CourseService', false);
                }

                $packages = $this->packageRepository->getByCourse($slug);
                if (!empty($packages)) {
                    throw new ServiceException(
                        "Cannot delete course with " . count($packages) . " active package(s). Delete or reassign its packages first.",
                        'CourseService',
                        false
                    );
                }

                $this->courseRepository->delete($slug);
                $this->auditLog('DELETE', 'Course', $slug, []);

                return ['success' => true, 'message' => 'Course deleted successfully'];
            },
            null,
            'deleteCourse'
        );
    }
}
