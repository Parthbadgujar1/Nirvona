<?php

namespace Nirvona\Repositories;

/**
 * QuestionRepository
 *
 * Data Access Layer for Question model (exam question bank).
 */
class QuestionRepository extends BaseRepository
{
    protected string $table = 'questions';

    /**
     * Get all questions for an exam, in question-number order
     *
     * @param string $examId
     * @return array
     */
    public function getByExam(string $examId): array
    {
        return $this->select(
            "SELECT * FROM {$this->table} WHERE examId = ? ORDER BY qNo ASC",
            [$examId]
        );
    }

    /**
     * Get questions for an exam filtered by subject
     *
     * @param string $examId
     * @param string $subject
     * @return array
     */
    public function getByExamAndSubject(string $examId, string $subject): array
    {
        return $this->select(
            "SELECT * FROM {$this->table} WHERE examId = ? AND subject = ? ORDER BY qNo ASC",
            [$examId, $subject]
        );
    }

    /**
     * Find a single question by exam + question number
     *
     * @param string $examId
     * @param int $qNo
     * @return ?array
     */
    public function findByExamAndNumber(string $examId, int $qNo): ?array
    {
        return $this->selectOne(
            "SELECT * FROM {$this->table} WHERE examId = ? AND qNo = ? LIMIT 1",
            [$examId, $qNo]
        );
    }

    /**
     * Count questions in an exam
     *
     * @param string $examId
     * @return int
     */
    public function countByExam(string $examId): int
    {
        $result = $this->selectOne(
            "SELECT COUNT(*) as total FROM {$this->table} WHERE examId = ?",
            [$examId]
        );
        return (int) ($result['total'] ?? 0);
    }
}
