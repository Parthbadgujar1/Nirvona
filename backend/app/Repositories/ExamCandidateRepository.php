<?php

namespace Nirvona\Repositories;

/**
 * ExamCandidateRepository
 *
 * Data Access Layer for ExamCandidate model (attendance & seat allocation).
 */
class ExamCandidateRepository extends BaseRepository
{
    protected string $table = 'exam_candidates';

    /**
     * Get all candidates registered for an exam
     *
     * @param string $examId
     * @return array
     */
    public function getByExam(string $examId): array
    {
        return $this->select(
            "SELECT * FROM {$this->table} WHERE examId = ? ORDER BY seatNo ASC NULLS LAST",
            [$examId]
        );
    }

    /**
     * The candidate roster for the admin exam page, with each candidate's REAL
     * state: their name from the student record, and whether an admit card /
     * credential actually exists for them.
     *
     * The status columns on exam_candidates itself are copies that nothing
     * keeps up to date (they read "pending" forever, and `studentName` was
     * never filled in), so this reads the source tables instead.
     */
    public function getRosterByExam(string $examId): array
    {
        return $this->select(
            "SELECT ec.id, ec.studentId, ec.examId, ec.attendance, ec.createdAt, ec.updatedAt,
                    COALESCE(s.fullName, ec.studentName) AS studentName,
                    COALESCE(ac.seatNo, ec.seatNo) AS seatNo,
                    COALESCE(ac.status, 'pending') AS admitCardStatus,
                    COALESCE(xc.status, 'pending') AS credentialStatus
             FROM {$this->table} ec
             LEFT JOIN students s ON s.id = ec.studentId
             LEFT JOIN admit_cards ac ON ac.studentId = ec.studentId AND ac.examId = ec.examId
             LEFT JOIN exam_credentials xc ON xc.studentId = ec.studentId AND xc.examId = ec.examId
             WHERE ec.examId = ?
             ORDER BY COALESCE(ac.seatNo, ec.seatNo) ASC NULLS LAST, s.fullName ASC",
            [$examId]
        );
    }

    /**
     * Get a student's candidacy across all exams
     *
     * @param string $studentId
     * @return array
     */
    public function getByStudent(string $studentId): array
    {
        return $this->select(
            "SELECT * FROM {$this->table} WHERE studentId = ?",
            [$studentId]
        );
    }

    /**
     * Find a student's candidacy for one exam
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
     * Count candidates registered for an exam
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

    /**
     * Record attendance for a candidate
     *
     * @param string $candidateId
     * @param string $attendance "present" | "absent" | "pending"
     * @return bool
     */
    public function markAttendance(string $candidateId, string $attendance): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET attendance = ?, updatedAt = NOW() WHERE id = ?"
        );
        return $stmt->execute([$attendance, $candidateId]);
    }

    /**
     * Get attendance summary counts for an exam
     *
     * @param string $examId
     * @return array{present:int, absent:int, pending:int}
     */
    public function getAttendanceSummary(string $examId): array
    {
        $result = $this->selectOne(
            "SELECT
                SUM(CASE WHEN attendance = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN attendance = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN attendance = 'pending' THEN 1 ELSE 0 END) as pending
             FROM {$this->table} WHERE examId = ?",
            [$examId]
        );

        return [
            'present' => (int) ($result['present'] ?? 0),
            'absent' => (int) ($result['absent'] ?? 0),
            'pending' => (int) ($result['pending'] ?? 0),
        ];
    }

    /**
     * Registered vs appeared vs absent per exam, most recent exams first -
     * powers the "Exam participation" dashboard chart.
     *
     * @param int $limit How many recent exams to include
     * @return array Rows: {examId, examName, registered, appeared, absent}
     */
    public function getParticipationByExam(int $limit = 6): array
    {
        return $this->select(
            "SELECT e.id as examId, e.name as examName,
                    COUNT(ec.id) as registered,
                    COUNT(ec.id) FILTER (WHERE ec.attendance = 'present') as appeared,
                    COUNT(ec.id) FILTER (WHERE ec.attendance = 'absent') as absent
             FROM exams e
             LEFT JOIN {$this->table} ec ON ec.examId = e.id
             GROUP BY e.id, e.name, e.date
             ORDER BY e.date DESC
             LIMIT ?",
            [$limit]
        );
    }
}
