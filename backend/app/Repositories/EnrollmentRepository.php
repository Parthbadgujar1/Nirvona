<?php

namespace Nirvona\Repositories;

/**
 * EnrollmentRepository
 *
 * Data Access Layer for Enrollment model.
 */
class EnrollmentRepository extends BaseRepository
{
    protected string $table = 'enrollments';

    /**
     * Get a student's enrollments, most recent first
     *
     * @param string $studentId
     * @return array
     */
    public function getByStudent(string $studentId): array
    {
        return $this->select(
            "SELECT e.*, p.name as packageName, c.name as courseName
             FROM {$this->table} e
             JOIN packages p ON e.packageId = p.id
             JOIN courses c ON e.courseSlug = c.slug
             WHERE e.studentId = ?
             ORDER BY e.startDate DESC",
            [$studentId]
        );
    }

    /**
     * Every student with a currently active, non-expired enrollment in a
     * course - the pool an admin registers as exam candidates from (see
     * ExamCandidateService::registerEnrolled()).
     *
     * @param string $courseSlug
     * @return string[] studentIds
     */
    public function getActiveStudentIdsForCourse(string $courseSlug): array
    {
        return array_column($this->select(
            "SELECT DISTINCT studentId FROM {$this->table}
             WHERE courseSlug = ? AND status = 'active' AND endDate >= CURRENT_DATE",
            [$courseSlug]
        ), 'studentId');
    }

    /**
     * Get a student's currently active enrollment for a course
     *
     * @param string $studentId
     * @param string $courseSlug
     * @return ?array
     */
    public function getActiveForCourse(string $studentId, string $courseSlug): ?array
    {
        return $this->selectOne(
            "SELECT * FROM {$this->table}
             WHERE studentId = ? AND courseSlug = ? AND status = 'active' AND endDate >= CURRENT_DATE
             ORDER BY endDate DESC
             LIMIT 1",
            [$studentId, $courseSlug]
        );
    }

    /**
     * Count active enrollments across every course
     *
     * @return int
     */
    public function countActive(): int
    {
        $result = $this->selectOne(
            "SELECT COUNT(*) as total FROM {$this->table} WHERE status = 'active'"
        );
        return (int) ($result['total'] ?? 0);
    }

    /**
     * Count active enrollments for a course
     *
     * @param string $courseSlug
     * @return int
     */
    public function countActiveByCourse(string $courseSlug): int
    {
        $result = $this->selectOne(
            "SELECT COUNT(*) as total FROM {$this->table}
             WHERE courseSlug = ? AND status = 'active'",
            [$courseSlug]
        );
        return (int) ($result['total'] ?? 0);
    }

    /**
     * Increment the tests-taken counter for an enrollment
     *
     * @param string $enrollmentId
     * @return bool
     */
    public function incrementTestsTaken(string $enrollmentId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET testsTaken = testsTaken + 1, updatedAt = NOW() WHERE id = ?"
        );
        return $stmt->execute([$enrollmentId]);
    }

    /**
     * Mark expired enrollments (endDate passed, still flagged active)
     *
     * @return int Number of rows updated
     */
    public function expireOutdated(): int
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET status = 'expired', updatedAt = NOW()
             WHERE status = 'active' AND endDate < CURRENT_DATE"
        );
        $stmt->execute();
        return $stmt->rowCount();
    }

    /**
     * Get monthly new-enrollment counts, grouped by calendar month - the
     * "converted to a paid enrolment" half of the registration trend
     * chart. Only returns months with at least one enrollment.
     *
     * @param int $months How many months back to include
     * @return array Rows: {ym: "2026-09", activations: int}
     */
    public function getMonthlyActivations(int $months = 6): array
    {
        return $this->select(
            "SELECT TO_CHAR(createdAt, 'YYYY-MM') as ym,
                    COUNT(*) as activations
             FROM {$this->table}
             WHERE createdAt >= (CURRENT_DATE - (? || ' months')::INTERVAL)
             GROUP BY TO_CHAR(createdAt, 'YYYY-MM')
             ORDER BY ym ASC",
            [$months]
        );
    }

    /**
     * Distribution of currently-active students across courses/programs
     * (counts distinct students, not enrollment rows, so one student
     * enrolled twice in the same course isn't double-counted).
     *
     * @return array Rows: {courseSlug, courseName, students}
     */
    public function getActiveDistributionByCourse(): array
    {
        return $this->select(
            "SELECT c.slug as courseSlug, c.name as courseName,
                    COUNT(DISTINCT e.studentId) as students
             FROM courses c
             LEFT JOIN {$this->table} e ON e.courseSlug = c.slug AND e.status = 'active'
             GROUP BY c.slug, c.name
             ORDER BY students DESC"
        );
    }
}
