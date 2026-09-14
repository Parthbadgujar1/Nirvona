<?php

namespace Nirvona\Repositories;

/**
 * StudentResponseRepository
 *
 * Data Access Layer for StudentResponse model. `rows` is stored as
 * JSONB and decoded/encoded on the way in and out.
 */
class StudentResponseRepository extends BaseRepository
{
    protected string $table = 'student_responses';

    /**
     * Find a student's response sheet for an exam
     *
     * @param string $examId
     * @param string $studentId
     * @return ?array
     */
    public function findByStudentAndExam(string $examId, string $studentId): ?array
    {
        $row = $this->selectOne(
            "SELECT * FROM {$this->table} WHERE examId = ? AND studentId = ? LIMIT 1",
            [$examId, $studentId]
        );
        return $row ? $this->decodeRows($row) : null;
    }

    /**
     * Get all response sheets uploaded for an exam
     *
     * @param string $examId
     * @return array
     */
    public function getByExam(string $examId): array
    {
        $rows = $this->select(
            "SELECT * FROM {$this->table} WHERE examId = ?",
            [$examId]
        );
        return array_map([$this, 'decodeRows'], $rows);
    }

    /**
     * Create a response sheet, JSON-encoding the rows array
     *
     * @param array $data
     * @return array
     */
    public function create(array $data): array
    {
        if (isset($data['rows']) && is_array($data['rows'])) {
            $data['rows'] = json_encode($data['rows']);
        }
        $created = parent::create($data);
        return $this->decodeRows($created);
    }

    /**
     * Update processing/validation status once evaluation completes
     *
     * @param string $id
     * @param string $processing "queued" | "processing" | "evaluated" | "failed"
     * @param string $validation "valid" | "invalid" | "pending"
     * @return bool
     */
    public function updateStatus(string $id, string $processing, string $validation): bool
    {
        return $this->update($id, [
            'processing' => $processing,
            'validation' => $validation,
        ]);
    }

    /**
     * Replace the rows array after evaluation (marked answers scored
     * against the answer key: status/correctOption/marks filled in)
     *
     * @param string $id
     * @param array $rows
     * @return bool
     */
    public function updateRows(string $id, array $rows): bool
    {
        return $this->update($id, ['rows' => json_encode($rows)]);
    }

    /**
     * One summary row per exam that has any uploaded response sheets -
     * backs the admin "Student Responses" overview page, which shows
     * one row per exam/upload-batch rather than one row per student.
     * Statuses are rolled up worst-first (any failed/invalid pulls the
     * whole exam's row to that status) so the summary reflects whether
     * an exam still needs attention.
     *
     * @return array
     */
    public function getUploadSummaries(): array
    {
        return $this->select(
            "SELECT
                examId,
                COUNT(*) as students,
                MAX(uploadedAt) as uploadedAt,
                CASE
                    WHEN bool_or(validation = 'invalid') THEN 'invalid'
                    WHEN bool_or(validation = 'pending') THEN 'pending'
                    ELSE 'valid'
                END as validation,
                CASE
                    WHEN bool_or(processing = 'failed') THEN 'failed'
                    WHEN bool_or(processing = 'processing') THEN 'processing'
                    WHEN bool_or(processing = 'queued') THEN 'queued'
                    ELSE 'evaluated'
                END as processing
             FROM {$this->table}
             GROUP BY examId
             ORDER BY MAX(uploadedAt) DESC"
        );
    }

    private function decodeRows(array $row): array
    {
        $row['rows'] = is_string($row['rows'] ?? null)
            ? (json_decode($row['rows'], true) ?? [])
            : ($row['rows'] ?? []);
        return $row;
    }
}
