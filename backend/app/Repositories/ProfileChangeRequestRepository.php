<?php

namespace Nirvona\Repositories;

class ProfileChangeRequestRepository extends BaseRepository
{
    protected string $table = 'profile_change_requests';

    /** @param array<string, mixed> $row */
    private function decode(array $row): array
    {
        if (is_string($row['changes'] ?? null)) {
            $row['changes'] = json_decode($row['changes'], true) ?: new \stdClass();
        }
        return $row;
    }

    public function getById(string $id): ?array
    {
        $row = parent::getById($id);
        return $row ? $this->decode($row) : null;
    }

    /**
     * @param array<string, string> $changes
     */
    public function createRequest(string $studentId, array $changes, ?string $reason): array
    {
        return $this->decode(parent::create([
            'studentId' => $studentId,
            'changes' => json_encode($changes),
            'reason' => $reason,
        ]));
    }

    public function hasPending(string $studentId): bool
    {
        $row = $this->selectOne(
            "SELECT 1 AS x FROM {$this->table} WHERE studentId = ? AND status = 'pending' LIMIT 1",
            [$studentId]
        );
        return $row !== null;
    }

    public function countSince(string $studentId, string $since): int
    {
        $row = $this->selectOne(
            "SELECT COUNT(*)::int AS n FROM {$this->table} WHERE studentId = ? AND createdAt >= ?",
            [$studentId, $since]
        );
        return (int) ($row['n'] ?? 0);
    }

    /** @return array<int, array<string, mixed>> */
    public function getByStudent(string $studentId): array
    {
        return array_map(
            [$this, 'decode'],
            $this->select(
                "SELECT id, changes, reason, status, adminNote, resolvedAt, createdAt
                 FROM {$this->table} WHERE studentId = ? ORDER BY createdAt DESC LIMIT 50",
                [$studentId]
            )
        );
    }

    /** @return array<int, array<string, mixed>> */
    public function listForAdmin(?string $status): array
    {
        $where = $status ? 'WHERE r.status = ?' : '';
        $rows = $this->select(
            "SELECT r.id, r.studentId, r.changes, r.reason, r.status, r.adminNote, r.resolvedAt, r.createdAt,
                    s.fullName AS studentName, s.email AS studentEmail
             FROM {$this->table} r
             JOIN students s ON s.id = r.studentId
             {$where}
             ORDER BY (r.status = 'pending') DESC, r.createdAt DESC
             LIMIT 200",
            $status ? [$status] : []
        );
        return array_map([$this, 'decode'], $rows);
    }

    /** Atomically move a PENDING request to a final state. */
    public function resolve(string $id, string $status, ?string $adminNote, ?string $adminId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table}
             SET status = ?, adminNote = ?, resolvedBy = ?, resolvedAt = NOW(), updatedAt = NOW()
             WHERE id = ? AND status = 'pending'"
        );
        $stmt->execute([$status, $adminNote, $adminId, $id]);
        return $stmt->rowCount() === 1;
    }

    public function countPending(): int
    {
        $row = $this->selectOne("SELECT COUNT(*)::int AS n FROM {$this->table} WHERE status = 'pending'");
        return (int) ($row['n'] ?? 0);
    }
}
