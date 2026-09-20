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
    /**
     * Admin exam list with LIVE readiness counts.
     *
     * `candidates`, `admitCardsGenerated` and `credentialsAssigned` used to be
     * read from counter columns that the code tried to keep in step (and never
     * did for credentials: nothing ever updated `credentialsAssigned`, so the
     * dashboard's "Credentials" bar always read 0). Counting the real rows here
     * means the numbers can never drift from the data behind them.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getAll(int $limit = 100, int $offset = 0): array
    {
        $stmt = $this->db->prepare(
            "SELECT e.*,
                    (SELECT COUNT(*) FROM exam_candidates ec WHERE ec.examId = e.id) AS candidates,
                    (SELECT COUNT(*) FROM admit_cards ac
                      WHERE ac.examId = e.id AND ac.status IN ('generated', 'published', 'sent')) AS admitCardsGenerated,
                    (SELECT COUNT(*) FROM exam_credentials xc
                      WHERE xc.examId = e.id AND xc.status <> 'revoked') AS credentialsAssigned
             FROM {$this->table} e
             ORDER BY e.date DESC, e.id
             LIMIT ? OFFSET ?"
        );
        $stmt->execute([$limit, $offset]);
        return ColumnCase::normalizeAll($stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

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
        // Was a JOIN + GROUP BY e.id, which Postgres rejects outright
        // ("column ec.id must appear in the GROUP BY clause") since
        // exam_centres columns aren't functionally dependent on e.id -
        // every single call to this (the only caller is the admin exam
        // detail page) failed with a SQL error, masked by
        // executeWithFallback's generic "Unable to fetch exam". A
        // candidate-count subquery sidesteps the grouping requirement
        // entirely instead of aggregating across a second join.
        return $this->selectOne(
            "SELECT e.*,
                    ec.name AS centreName,
                    ec.address AS centreAddress,
                    ec.city AS centreCity,
                    ec.state AS centreState,
                    ec.pincode AS centrePincode,
                    ec.capacity AS centreCapacity,
                    ec.labs AS centreLabs,
                    (SELECT COUNT(*) FROM exam_candidates WHERE examId = e.id)::int AS candidateCount,
                    (SELECT COUNT(*) FROM exam_candidates WHERE examId = e.id)::int AS candidates,
                    (SELECT COUNT(*) FROM admit_cards
                      WHERE examId = e.id AND status IN ('generated', 'published', 'sent'))::int AS admitCardsGenerated,
                    (SELECT COUNT(*) FROM exam_credentials
                      WHERE examId = e.id AND status <> 'revoked')::int AS credentialsAssigned
             FROM {$this->table} e
             LEFT JOIN exam_centres ec ON e.centreId = ec.id
             WHERE e.id = ?",
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
     * Recompute the denormalized `candidates` counter from the real
     * exam_candidates rows. Nothing ever called this - registering a
     * candidate never updated it, so it always read 0 regardless of how
     * many candidates an exam actually had (visible anywhere this
     * column is displayed: exam lists, exam stats, the notification
     * compose audience picker's candidate count).
     *
     * @param string $examId
     * @return void
     */
    public function syncCandidateCount(string $examId): void
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET candidates = (
                SELECT COUNT(*) FROM exam_candidates WHERE examId = ?
             ), updatedAt = NOW()
             WHERE id = ?"
        );
        $stmt->execute([$examId, $examId]);
    }

    /**
     * Recompute the denormalized `admitCardsGenerated` counter from the
     * real admit_cards rows - same class of bug as syncCandidateCount()
     * above: nothing ever called this, so the "Generation coverage"
     * progress bar on the admin admit-cards page always read 0/N
     * regardless of how many cards had actually been generated.
     *
     * @param string $examId
     * @return void
     */
    public function syncAdmitCardsGenerated(string $examId): void
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET admitCardsGenerated = (
                SELECT COUNT(*) FROM admit_cards
                WHERE examId = ? AND status IN ('generated', 'published', 'sent')
             ), updatedAt = NOW()
             WHERE id = ?"
        );
        $stmt->execute([$examId, $examId]);
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
