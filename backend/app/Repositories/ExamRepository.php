<?php

namespace Nirvona\Repositories;

/**
 * ExamRepository
 *
 * Data Access Layer for Exam model.
 */
class ExamRepository extends BaseRepository
{
    protected string $table = 'exams';

    /**
     * Get exams by course
     *
     * @param string $courseSlug
     * @return array List of exams
     */
    public function getByCourse(string $courseSlug): array
    {
        return $this->select(
            "SELECT * FROM {$this->table} WHERE courseSlug = ? ORDER BY date DESC",
            [$courseSlug]
        );
    }

    /**
     * Get upcoming exams
     *
     * @return array Upcoming exams
     */
    public function getUpcoming(): array
    {
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE date > NOW()
             AND status IN ('scheduled', 'admit-card-available')
             ORDER BY date ASC
             LIMIT 10"
        );
    }

    /**
     * Get completed exams
     *
     * @return array Completed exams
     */
    public function getCompleted(): array
    {
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE status IN ('completed', 'result-published')
             ORDER BY date DESC
             LIMIT 20"
        );
    }

    /**
     * Get exam with details including candidates
     *
     * @param string $examId
     * @return ?array Exam with details
     */
    public function getWithDetails(string $examId): ?array
    {
        return $this->selectOne(
            "SELECT e.*,
                    ec.id as centreId,
                    ec.name as centreName,
                    ec.address as centreAddress,
                    COUNT(DISTINCT c.studentId) as candidateCount
             FROM {$this->table} e
             LEFT JOIN exam_centres ec ON e.centreId = ec.id
             LEFT JOIN exam_candidates c ON e.id = c.examId
             WHERE e.id = ?
             GROUP BY e.id",
            [$examId]
        );
    }

    /**
     * Count exams by status
     *
     * @param string $status
     * @return int Count
     */
    public function countByStatus(string $status): int
    {
        $result = $this->selectOne(
            "SELECT COUNT(*) as total FROM {$this->table} WHERE status = ?",
            [$status]
        );
        return $result['total'] ?? 0;
    }

    /**
     * Get exams by status
     *
     * @param string $status
     * @return array Exams with status
     */
    public function getByStatus(string $status): array
    {
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE status = ?
             ORDER BY date DESC",
            [$status]
        );
    }

    /**
     * Search exams
     *
     * @param string $query
     * @return array Matching exams
     */
    public function search(string $query): array
    {
        $query = '%' . $query . '%';
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE name ILIKE ? OR courseSlug ILIKE ?
             ORDER BY date DESC
             LIMIT 50",
            [$query, $query]
        );
    }
}
