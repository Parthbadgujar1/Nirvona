<?php

namespace Nirvona\Repositories;

/**
 * ResultRepository
 *
 * Data Access Layer for Result model.
 */
class ResultRepository extends BaseRepository
{
    protected string $table = 'results';

    /**
     * Get results by student
     *
     * @param string $studentId
     * @return array List of results
     */
    public function getByStudent(string $studentId): array
    {
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE studentId = ?
             ORDER BY date DESC",
            [$studentId]
        );
    }

    /**
     * Get results by exam
     *
     * @param string $examId
     * @return array List of results
     */
    public function getByExam(string $examId): array
    {
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE examId = ?
             ORDER BY rank ASC",
            [$examId]
        );
    }

    /**
     * Get student's exam result
     *
     * @param string $studentId
     * @param string $examId
     * @return ?array Result or null
     */
    public function getStudentExamResult(string $studentId, string $examId): ?array
    {
        return $this->selectOne(
            "SELECT * FROM {$this->table}
             WHERE studentId = ? AND examId = ?
             LIMIT 1",
            [$studentId, $examId]
        );
    }

    /**
     * Get exam leaderboard
     *
     * @param string $examId
     * @param int $limit
     * @return array Top results
     */
    public function getLeaderboard(string $examId, int $limit = 100): array
    {
        return $this->select(
            "SELECT r.*, s.fullName, s.className
             FROM {$this->table} r
             JOIN students s ON r.studentId = s.id
             WHERE r.examId = ?
             ORDER BY r.rank ASC
             LIMIT ?",
            [$examId, $limit]
        );
    }

    /**
     * Get student's performance analytics
     *
     * @param string $studentId
     * @param string $courseSlug
     * @return array Analytics data
     */
    public function getPerformanceAnalytics(string $studentId, string $courseSlug): array
    {
        $scoreTrend = $this->select(
            "SELECT examName, score, percentage
             FROM {$this->table}
             WHERE studentId = ? AND courseSlug = ? AND status = 'published'
             ORDER BY date ASC
             LIMIT 10",
            [$studentId, $courseSlug]
        );

        $stats = $this->selectOne(
            "SELECT
                COUNT(*) as totalExams,
                AVG(percentage) as avgPercentage,
                MAX(percentage) as bestScore,
                MIN(percentage) as worstScore,
                AVG(accuracy) as avgAccuracy
             FROM {$this->table}
             WHERE studentId = ? AND courseSlug = ? AND status = 'published'",
            [$studentId, $courseSlug]
        );

        return [
            'scoreTrend' => $scoreTrend,
            'stats' => $stats ?? [],
        ];
    }

    /**
     * Get results by status
     *
     * @param string $status
     * @return array Results with status
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
     * Count results by status
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
     * Get average score for exam
     *
     * @param string $examId
     * @return float Average score
     */
    public function getAverageScore(string $examId): float
    {
        $result = $this->selectOne(
            "SELECT AVG(score) as average FROM {$this->table} WHERE examId = ?",
            [$examId]
        );
        return (float) ($result['average'] ?? 0);
    }

    /**
     * Get results by date range
     *
     * @param string $startDate
     * @param string $endDate
     * @return array Results in range
     */
    public function getByDateRange(string $startDate, string $endDate): array
    {
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE DATE(date) BETWEEN ? AND ?
             ORDER BY date DESC",
            [$startDate, $endDate]
        );
    }
}
