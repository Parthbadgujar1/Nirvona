<?php

namespace Nirvona\Repositories;

/**
 * AdminRepository
 *
 * Data Access Layer for Admin model. Mirrors StudentRepository's
 * password-hash discipline - findByEmail() (used for login) returns
 * the hash since it must be checked; every other method should strip
 * it before returning to a client.
 */
class AdminRepository extends BaseRepository
{
    protected string $table = 'admins';

    /** Columns safe to expose to a client (no passwordHash) */
    private const PUBLIC_COLUMNS = 'id, name, email, avatarUrl, status, createdAt, updatedAt';

    /**
     * Get by ID with the password hash stripped, same discipline as
     * StudentRepository::getById() - defense in depth alongside
     * getPublicById() in case something calls the generic accessor
     * directly.
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
     * Get all admins with password hashes stripped
     *
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function getAll(int $limit = 100, int $offset = 0): array
    {
        return array_map(function (array $row) {
            unset($row['passwordHash']);
            return $row;
        }, parent::getAll($limit, $offset));
    }

    /**
     * Find an admin by email, including the password hash - for
     * verifying a login attempt only. Never return this to a client.
     *
     * @param string $email
     * @return ?array
     */
    public function findByEmail(string $email): ?array
    {
        return $this->selectOne(
            "SELECT * FROM {$this->table} WHERE email = ? LIMIT 1",
            [$email]
        );
    }

    /**
     * Get an admin by ID with the password hash excluded
     *
     * @param string $id
     * @return ?array
     */
    public function getPublicById(string $id): ?array
    {
        return $this->selectOne(
            "SELECT " . self::PUBLIC_COLUMNS . " FROM {$this->table} WHERE id = ? LIMIT 1",
            [$id]
        );
    }

    /**
     * Create an admin, hashing the plaintext password before storage
     *
     * @param array $data name, email, avatarUrl?
     * @param string $plainPassword
     * @return array Created row (password hash excluded)
     */
    public function createWithPassword(array $data, string $plainPassword): array
    {
        $data['passwordHash'] = password_hash($plainPassword, PASSWORD_DEFAULT);
        $created = $this->create($data);
        unset($created['passwordHash']);
        return $created;
    }

    /**
     * Verify a login attempt against the stored hash
     *
     * @param string $email
     * @param string $plainPassword
     * @return bool
     */
    public function verifyPassword(string $email, string $plainPassword): bool
    {
        $row = $this->findByEmail($email);
        if (!$row || empty($row['passwordHash'])) {
            return false;
        }
        return password_verify($plainPassword, $row['passwordHash']);
    }
}
