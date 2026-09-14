<?php

namespace Nirvona\Repositories;

/**
 * AnswerKeyRepository
 *
 * Data Access Layer for AnswerKey model. `entries` is stored as JSONB
 * and decoded/encoded on the way in and out.
 */
class AnswerKeyRepository extends BaseRepository
{
    protected string $table = 'answer_keys';

    /**
     * Find the answer key for an exam
     *
     * @param string $examId
     * @return ?array
     */
    public function findByExam(string $examId): ?array
    {
        $row = $this->selectOne(
            "SELECT * FROM {$this->table} WHERE examId = ? LIMIT 1",
            [$examId]
        );
        return $row ? $this->decodeEntries($row) : null;
    }

    /**
     * Create or replace the answer key for an exam
     *
     * @param string $examId
     * @param array $entries List of {qNo, subject, topic, correctOption, marks, negative}
     * @return array
     */
    public function upsertForExam(string $examId, array $entries): array
    {
        $existing = $this->selectOne(
            "SELECT id FROM {$this->table} WHERE examId = ? LIMIT 1",
            [$examId]
        );

        $payload = [
            'entries' => json_encode($entries),
            'totalQuestions' => count($entries),
        ];

        if ($existing) {
            $this->update($existing['id'], $payload);
            return $this->findByExam($examId);
        }

        $payload['examId'] = $examId;
        $payload['status'] = 'draft';
        $created = parent::create($payload);
        return $this->decodeEntries($created);
    }

    /**
     * Publish an answer key so students can view it
     *
     * @param string $examId
     * @return bool
     */
    public function publish(string $examId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table}
             SET status = 'published', publishedAt = NOW(), updatedAt = NOW()
             WHERE examId = ?"
        );
        return $stmt->execute([$examId]);
    }

    /**
     * Unpublish an answer key, hiding it from candidates again. Results
     * already derived from it are untouched - only visibility changes.
     *
     * @param string $examId
     * @return bool
     */
    public function unpublish(string $examId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table}
             SET status = 'validated', updatedAt = NOW()
             WHERE examId = ?"
        );
        return $stmt->execute([$examId]);
    }

    /**
     * One row per exam that has an answer key uploaded - backs the
     * admin Answer Keys overview page (list every exam's key status),
     * as opposed to findByExam() which is scoped to one exam.
     *
     * @return array
     */
    public function getAll(int $limit = 100, int $offset = 0): array
    {
        $rows = $this->select(
            "SELECT ak.*, e.name as examName
             FROM {$this->table} ak
             LEFT JOIN exams e ON e.id = ak.examId
             ORDER BY ak.uploadedAt DESC
             LIMIT ? OFFSET ?",
            [$limit, $offset]
        );
        return array_map([$this, 'decodeEntries'], $rows);
    }

    private function decodeEntries(array $row): array
    {
        $row['entries'] = is_string($row['entries'] ?? null)
            ? (json_decode($row['entries'], true) ?? [])
            : ($row['entries'] ?? []);
        return $row;
    }
}
