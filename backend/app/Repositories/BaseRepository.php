<?php

namespace Nirvona\Repositories;

use PDO;

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
        return $result ?: null;
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
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Create new record
     *
     * @param array $data
     * @return array Created record
     */
    public function create(array $data): array
    {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));

        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})"
        );
        $stmt->execute(array_values($data));

        $lastId = $this->db->lastInsertId();
        return $this->getById($lastId);
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

        $set = implode(', ', array_map(fn($k) => "{$k} = ?", array_keys($data)));
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
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
        return $result ?: null;
    }
}
