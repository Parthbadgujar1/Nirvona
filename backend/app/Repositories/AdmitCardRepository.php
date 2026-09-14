<?php

namespace Nirvona\Repositories;

/**
 * AdmitCardRepository
 *
 * Data Access Layer for AdmitCard model.
 */
class AdmitCardRepository extends BaseRepository
{
    protected string $table = 'admit_cards';

    /**
     * Get all admit cards for an exam
     *
     * @param string $examId
     * @return array
     */
    public function getByExam(string $examId): array
    {
        // Joins the candidate's name in directly - the admin admit-cards
        // table renders it per row, and without this every row's name
        // lookup against a client-side student list silently missed
        // (real studentIds are UUIDs the frontend's mock roster never had).
        return $this->select(
            "SELECT ac.*, s.fullName as studentName
             FROM {$this->table} ac
             LEFT JOIN students s ON s.id = ac.studentId
             WHERE ac.examId = ?",
            [$examId]
        );
    }

    /**
     * Get a student's admit cards across all exams
     *
     * @param string $studentId
     * @return array
     */
    public function getByStudent(string $studentId): array
    {
        return $this->select(
            "SELECT ac.*, e.name as examName, e.date as examDate
             FROM {$this->table} ac
             JOIN exams e ON ac.examId = e.id
             WHERE ac.studentId = ?
             ORDER BY e.date DESC",
            [$studentId]
        );
    }

    /**
     * Find a student's admit card for one exam
     *
     * @param string $studentId
     * @param string $examId
     * @return ?array
     */
    public function findByStudentAndExam(string $studentId, string $examId): ?array
    {
        return $this->selectOne(
            "SELECT * FROM {$this->table} WHERE studentId = ? AND examId = ? LIMIT 1",
            [$studentId, $examId]
        );
    }

    /**
     * Mark an admit card generated
     *
     * @param string $id
     * @return bool
     */
    public function markGenerated(string $id): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET status = 'generated', generatedAt = NOW(), updatedAt = NOW() WHERE id = ?"
        );
        return $stmt->execute([$id]);
    }

    /**
     * Publish an admit card to the student
     *
     * @param string $id
     * @return bool
     */
    public function markPublished(string $id): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET status = 'published', publishedAt = NOW(), updatedAt = NOW() WHERE id = ?"
        );
        return $stmt->execute([$id]);
    }

    /**
     * Count admit cards generated for an exam
     *
     * @param string $examId
     * @return int
     */
    public function countGeneratedByExam(string $examId): int
    {
        $result = $this->selectOne(
            "SELECT COUNT(*) as total FROM {$this->table}
             WHERE examId = ? AND status IN ('generated', 'published', 'sent')",
            [$examId]
        );
        return (int) ($result['total'] ?? 0);
    }
}
