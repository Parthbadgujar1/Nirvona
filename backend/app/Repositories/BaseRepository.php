<?php

namespace Nirvona\Repositories;

use PDO;
use Ramsey\Uuid\Uuid;

/**
 * BaseRepository
 *
 * Base class for all repositories.
 * Provides common CRUD operations and database connection.
 */
abstract class BaseRepository
{
    protected string $table = '';
    protected PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Get by ID
     *
     * @param string $id
     * @return ?array Record or null
     */
    public function getById(string $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? ColumnCase::normalize($result) : null;
    }

    /**
     * Get all records
     *
     * @param int $limit
     * @param int $offset
     * @return array Records
     */
    public function getAll(int $limit = 100, int $offset = 0): array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table} LIMIT ? OFFSET ?"
        );
        $stmt->execute([$limit, $offset]);
        return ColumnCase::normalizeAll($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Create new record
     *
     * Every table here uses a UUID primary key. Postgres used to
     * generate it DB-side (DEFAULT gen_random_uuid()) and hand the
     * whole inserted row back via `RETURNING *` in one round-trip -
     * MySQL has neither: no portable function-default UUID (MySQL 8's
     * UUID() default expression isn't available on older MariaDB, which
     * shared hosts commonly run) and no RETURNING clause at all. So the
     * id is generated here in PHP before the INSERT, and the row is
     * re-read by that id afterward to pick up server-side defaults
     * (status columns, createdAt/updatedAt) the same way `RETURNING *`
     * used to.
     *
     * @param array $data
     * @return array Created record
     */
    public function create(array $data): array
    {
        if (!isset($data['id'])) {
            $data['id'] = Uuid::uuid4()->toString();
        }

        // Backtick every column name: `rank` (results, leaderboards) is
        // a reserved word in MySQL 8.0.2+ (added for window functions)
        // and errors as a bare identifier - quoting every column here,
        // not just that one, means any future column name that happens
        // to collide with a reserved word doesn't silently break here too.
        $columns = implode(', ', array_map(fn($k) => "`{$k}`", array_keys($data)));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));

        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})"
        );
        $stmt->execute(array_values($data));

        return $this->getById($data['id']) ?? $data;
    }

    /**
     * Update record
     *
     * @param string $id
     * @param array $data
     * @return bool Success status
     */
    public function update(string $id, array $data): bool
    {
        if (empty($data)) {
            return false;
        }

        $set = implode(', ', array_map(fn($k) => "`{$k}` = ?", array_keys($data)));
        $values = array_values($data);
        $values[] = $id;

        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET {$set}, updatedAt = NOW() WHERE id = ?"
        );
        return $stmt->execute($values);
    }

    /**
     * Delete record
     *
     * @param string $id
     * @return bool Success status
     */
    public function delete(string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Count total records
     *
     * @return int Total count
     */
    public function count(): int
    {
        $result = $this->db->query("SELECT COUNT(*) as total FROM {$this->table}");
        return $result->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    }

    /**
     * Execute raw query
     *
     * @param string $query SQL query
     * @param array $params Query parameters
     * @return array Query results
     */
    protected function select(string $query, array $params = []): array
    {
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        return ColumnCase::normalizeAll($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Execute raw query for single result
     *
     * @param string $query SQL query
     * @param array $params Query parameters
     * @return ?array Single result or null
     */
    protected function selectOne(string $query, array $params = []): ?array
    {
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? ColumnCase::normalize($result) : null;
    }
}
