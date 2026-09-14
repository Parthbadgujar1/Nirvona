<?php

namespace Nirvona\Repositories;

/**
 * ExamCredentialRepository
 *
 * Data Access Layer for ExamCredential model.
 *
 * Passwords are always hashed on write and never selected back out in
 * bulk-listing methods - only findByLoginId() (used to verify a login
 * attempt) returns the hash.
 */
class ExamCredentialRepository extends BaseRepository
{
    protected string $table = 'exam_credentials';

    /** Columns safe to expose to a client (no passwordHash) */
    private const PUBLIC_COLUMNS = 'id, studentId, examId, studentName, loginId, status, assignedAt, createdAt, updatedAt';

    /**
     * Get by ID with the password hash stripped - defense in depth
     * alongside the PUBLIC_COLUMNS-scoped methods below, in case
     * something calls the generic accessor directly.
     *
     * @param string $id
     * @return ?array
     */
    public function getById(string $id): ?array
    {
        $row = parent::getById($id);
        if ($row) {
            unset($row['passwordHash']);
        }
        return $row;
    }

    /**
     * Get all credentials for an exam (password hash excluded)
     *
     * @param string $examId
     * @return array
     */
    public function getByExam(string $examId): array
    {
        return $this->select(
            "SELECT " . self::PUBLIC_COLUMNS . " FROM {$this->table} WHERE examId = ?",
            [$examId]
        );
    }

    /**
     * Find a student's credential for one exam (password hash excluded)
     *
     * @param string $studentId
     * @param string $examId
     * @return ?array
     */
    public function findByStudentAndExam(string $studentId, string $examId): ?array
    {
        return $this->selectOne(
            "SELECT " . self::PUBLIC_COLUMNS . " FROM {$this->table}
             WHERE studentId = ? AND examId = ? LIMIT 1",
            [$studentId, $examId]
        );
    }

    /**
     * Find a credential by login ID, including the password hash -
     * for verifying a login attempt only. Never return this to a client.
     *
     * @param string $loginId
     * @return ?array
     */
    public function findByLoginId(string $loginId): ?array
    {
        return $this->selectOne(
            "SELECT * FROM {$this->table} WHERE loginId = ? LIMIT 1",
            [$loginId]
        );
    }

    /**
     * Create a credential, hashing the plaintext password before storage
     *
     * @param array $data All ExamCredential fields except passwordHash
     * @param string $plainPassword
     * @return array Created row (password hash excluded)
     */
    public function createWithPassword(array $data, string $plainPassword): array
    {
        $data['passwordHash'] = password_hash($plainPassword, PASSWORD_DEFAULT);
        $created = parent::create($data);
        unset($created['passwordHash']);
        return $created;
    }

    /**
     * Verify a login attempt against the stored hash
     *
     * @param string $loginId
     * @param string $plainPassword
     * @return bool
     */
    public function verifyPassword(string $loginId, string $plainPassword): bool
    {
        $row = $this->findByLoginId($loginId);
        if (!$row || empty($row['passwordHash'])) {
            return false;
        }
        return password_verify($plainPassword, $row['passwordHash']);
    }
}
