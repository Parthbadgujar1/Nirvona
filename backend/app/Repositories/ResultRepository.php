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
        // Joins the candidate's name in directly - `results` has no
        // studentName column of its own, and the admin review table
        // renders one per row.
        return $this->select(
            "SELECT r.*, s.fullName as studentName
             FROM {$this->table} r
             LEFT JOIN students s ON s.id = r.studentId
             WHERE r.examId = ?
             ORDER BY r.rank ASC",
            [$examId]
        );
    }

    /**
     * Get results for an exam ordered by score, highest first - used to
     * (re)compute rank/percentile before they've been assigned yet, e.g.
     * when building a leaderboard from freshly scored results.
     *
     * @param string $examId
     * @return array
     */
    public function getByExamOrderedByScore(string $examId): array
    {
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE examId = ?
             ORDER BY score DESC",
            [$examId]
        );
    }

    /**
     * Update a result's rank/percentile/totalCandidates in one call -
     * used after (re)computing a leaderboard for an exam.
     *
     * @param string $id
     * @param int $rank
     * @param float $percentile
     * @param int $totalCandidates
     * @return bool
     */
    public function updateRanking(string $id, int $rank, float $percentile, int $totalCandidates): bool
    {
        return $this->update($id, [
            'rank' => $rank,
            'percentile' => $percentile,
            'totalCandidates' => $totalCandidates,
        ]);
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
     * Mark every result for an exam as published
     *
     * @param string $examId
     * @return int Number of rows updated
     */
    public function publishByExam(string $examId): int
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET status = 'published', updatedAt = NOW() WHERE examId = ?"
        );
        $stmt->execute([$examId]);
        return $stmt->rowCount();
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
