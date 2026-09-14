<?php

namespace Nirvona\Repositories;

/**
 * TopicPerformanceRepository
 *
 * Data Access Layer for TopicPerformance model (per-student topic
 * accuracy rollups).
 */
class TopicPerformanceRepository extends BaseRepository
{
    protected string $table = 'topic_performance';

    /**
     * Get a student's topic performance within a course
     *
     * @param string $studentId
     * @param string $courseSlug
     * @return array
     */
    public function getByStudent(string $studentId, string $courseSlug): array
    {
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE studentId = ? AND courseSlug = ?
             ORDER BY accuracy ASC",
            [$studentId, $courseSlug]
        );
    }

    /**
     * Get a student's weakest topics (low accuracy, meaningfully attempted)
     *
     * @param string $studentId
     * @param string $courseSlug
     * @param int $limit
     * @return array
     */
    public function getWeakTopics(string $studentId, string $courseSlug, int $limit = 5): array
    {
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE studentId = ? AND courseSlug = ? AND attempted >= 3
             ORDER BY accuracy ASC
             LIMIT ?",
            [$studentId, $courseSlug, $limit]
        );
    }

    /**
     * Get a student's strongest topics
     *
     * @param string $studentId
     * @param string $courseSlug
     * @param int $limit
     * @return array
     */
    public function getStrongTopics(string $studentId, string $courseSlug, int $limit = 5): array
    {
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE studentId = ? AND courseSlug = ? AND attempted >= 3
             ORDER BY accuracy DESC
             LIMIT ?",
            [$studentId, $courseSlug, $limit]
        );
    }

    /**
     * Upsert a student's rollup for one topic - merges new attempt counts
     * into the running total and recomputes accuracy/trend.
     *
     * @param string $studentId
     * @param string $courseSlug
     * @param string $subject
     * @param string $topic
     * @param int $correctDelta Newly-correct answers to add
     * @param int $attemptedDelta Newly-attempted questions to add
     * @return array
     */
    public function recordAttempt(
        string $studentId,
        string $courseSlug,
        string $subject,
        string $topic,
        int $correctDelta,
        int $attemptedDelta
    ): array {
        $existing = $this->selectOne(
            "SELECT * FROM {$this->table}
             WHERE studentId = ? AND courseSlug = ? AND subject = ? AND topic = ?
             LIMIT 1",
            [$studentId, $courseSlug, $subject, $topic]
        );

        $priorAccuracy = (float) ($existing['accuracy'] ?? 0);
        $attempted = (int) ($existing['attempted'] ?? 0) + $attemptedDelta;
        $total = (int) ($existing['total'] ?? 0) + $attemptedDelta;
        $correct = (int) round(($priorAccuracy / 100) * ($existing['attempted'] ?? 0)) + $correctDelta;
        $accuracy = $attempted > 0 ? round(($correct / $attempted) * 100, 2) : 0;
        $trend = round($accuracy - $priorAccuracy, 2);

        if ($existing) {
            $this->update($existing['id'], [
                'attempted' => $attempted,
                'total' => $total,
                'accuracy' => $accuracy,
                'trend' => $trend,
            ]);
            return $this->selectOne("SELECT * FROM {$this->table} WHERE id = ?", [$existing['id']]);
        }

        return parent::create([
            'studentId' => $studentId,
            'courseSlug' => $courseSlug,
            'subject' => $subject,
            'topic' => $topic,
            'attempted' => $attempted,
            'total' => $total,
            'accuracy' => $accuracy,
            'trend' => 0,
        ]);
    }
}
