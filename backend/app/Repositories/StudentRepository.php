<?php

namespace Nirvona\Repositories;

/**
 * StudentRepository
 *
 * Data Access Layer for Student model.
 * Centralizes all database queries related to students.
 * Makes it easy to swap database implementations.
 */
class StudentRepository extends BaseRepository
{
    protected string $table = 'students';

    /**
     * Find student by email
     *
     * @param string $email
     * @return ?array Student data or null
     */
    public function findByEmail(string $email): ?array
    {
        return $this->db->selectOne(
            "SELECT * FROM {$this->table} WHERE email = ? LIMIT 1",
            [$email]
        );
    }

    /**
     * Find active students by class
     *
     * @param string $className
     * @return array List of students
     */
    public function findByClass(string $className): array
    {
        return $this->db->select(
            "SELECT * FROM {$this->table} WHERE className = ? AND status = 'active'",
            [$className]
        );
    }

    /**
     * Get student's enrollments
     *
     * @param string $studentId
     * @return array List of enrollments
     */
    public function getEnrollments(string $studentId): array
    {
        return $this->db->select(
            "SELECT e.*, p.name as packageName, c.name as courseName
             FROM enrollments e
             JOIN packages p ON e.packageId = p.id
             JOIN courses c ON e.courseSlug = c.slug
             WHERE e.studentId = ?
             ORDER BY e.startDate DESC",
            [$studentId]
        );
    }

    /**
     * Count active students
     *
     * @return int Total active students
     */
    public function countActive(): int
    {
        $result = $this->db->selectOne(
            "SELECT COUNT(*) as total FROM {$this->table} WHERE status = 'active'"
        );
        return $result['total'] ?? 0;
    }

    /**
     * Get students by city
     *
     * @param string $city
     * @return array List of students
     */
    public function findByCity(string $city): array
    {
        return $this->db->select(
            "SELECT * FROM {$this->table} WHERE city = ? AND status = 'active'",
            [$city]
        );
    }

    /**
     * Get leaderboard for a course
     *
     * @param string $courseSlug
     * @param int $limit
     * @return array Top students with scores
     */
    public function getLeaderboard(string $courseSlug, int $limit = 100): array
    {
        return $this->db->select(
            "SELECT s.id, s.fullName, s.className, AVG(r.percentage) as avgPercentage,
                    COUNT(r.id) as totalExams, MAX(r.rank) as bestRank
             FROM {$this->table} s
             LEFT JOIN results r ON s.id = r.studentId
             WHERE r.courseSlug = ? AND s.status = 'active'
             GROUP BY s.id, s.fullName, s.className
             ORDER BY avgPercentage DESC, totalExams DESC
             LIMIT ?",
            [$courseSlug, $limit]
        );
    }

    /**
     * Search students by name or email
     *
     * @param string $query Search query
     * @return array Matching students
     */
    public function search(string $query): array
    {
        $query = '%' . $query . '%';
        return $this->db->select(
            "SELECT * FROM {$this->table}
             WHERE (fullName ILIKE ? OR email ILIKE ?)
             AND status = 'active'
             LIMIT 50",
            [$query, $query]
        );
    }
}
