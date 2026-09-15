<?php

namespace Nirvona\Repositories;

use PDO;

/**
 * CourseRepository
 *
 * Data Access Layer for Course model.
 *
 * Courses use `slug` as their primary key (not `id`), so unlike the
 * other repositories this overrides BaseRepository's id-based CRUD
 * methods instead of inheriting them.
 */
class CourseRepository extends BaseRepository
{
    protected string $table = 'courses';

    /** JSONB columns that need decoding after every read */
    private const JSON_COLUMNS = [
        'audience', 'highlights', 'examPattern', 'patternNotes', 'faqs', 'stats',
    ];

    /**
     * Find course by slug
     *
     * @param string $slug
     * @return ?array Course data or null
     */
    public function findBySlug(string $slug): ?array
    {
        $row = $this->selectOne("SELECT * FROM {$this->table} WHERE slug = ? LIMIT 1", [$slug]);
        return $row ? $this->decodeJsonColumns($row) : null;
    }

    /**
     * Get all active courses
     *
     * @return array
     */
    public function getActive(): array
    {
        $rows = $this->select("SELECT * FROM {$this->table} WHERE status = 'active' ORDER BY name");
        return array_map([$this, 'decodeJsonColumns'], $rows);
    }

    /**
     * Get every course regardless of status - for admin management, where
     * an inactive/draft course still needs to be visible to edit or
     * reactivate. getActive() is for the public catalogue only.
     *
     * @return array
     */
    public function getAllForAdmin(): array
    {
        $rows = $this->select("SELECT * FROM {$this->table} ORDER BY name");
        return array_map([$this, 'decodeJsonColumns'], $rows);
    }

    /**
     * Create a course
     *
     * @param array $data Must include 'slug'
     * @return array Created course
     */
    public function create(array $data): array
    {
        $data = $this->encodeJsonColumns($data);
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));

        $stmt = $this->db->prepare(
            "INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})"
        );
        $stmt->execute(array_values($data));

        return $this->findBySlug($data['slug']);
    }

    /**
     * Update a course by slug
     *
     * @param string $slug
     * @param array $data
     * @return bool
     */
    public function update(string $slug, array $data): bool
    {
        if (empty($data)) {
            return false;
        }

        $data = $this->encodeJsonColumns($data);
        $set = implode(', ', array_map(fn($k) => "{$k} = ?", array_keys($data)));
        $values = array_values($data);
        $values[] = $slug;

        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET {$set}, updatedAt = NOW() WHERE slug = ?"
        );
        return $stmt->execute($values);
    }

    /**
     * Delete a course by slug
     *
     * @param string $slug
     * @return bool
     */
    public function delete(string $slug): bool
    {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE slug = ?");
        return $stmt->execute([$slug]);
    }

    /**
     * Get subjects for a course
     *
     * @param string $slug
     * @return array
     */
    public function getSubjects(string $slug): array
    {
        return $this->select(
            "SELECT * FROM subjects WHERE courseSlug = ? ORDER BY orderIndex ASC",
            [$slug]
        );
    }

    /**
     * Get packages for a course
     *
     * @param string $slug
     * @return array
     */
    public function getPackages(string $slug): array
    {
        return $this->select(
            "SELECT * FROM packages WHERE courseSlug = ? AND status = 'active' ORDER BY durationMonths ASC",
            [$slug]
        );
    }

    /**
     * Search courses by name
     *
     * @param string $query
     * @return array
     */
    public function search(string $query): array
    {
        $query = '%' . $query . '%';
        $rows = $this->select(
            "SELECT * FROM {$this->table} WHERE name ILIKE ? OR shortName ILIKE ? LIMIT 50",
            [$query, $query]
        );
        return array_map([$this, 'decodeJsonColumns'], $rows);
    }

    /**
     * json_decode every JSONB column in a row
     *
     * @param array $row
     * @return array
     */
    private function decodeJsonColumns(array $row): array
    {
        foreach (self::JSON_COLUMNS as $column) {
            if (isset($row[$column]) && is_string($row[$column])) {
                $row[$column] = json_decode($row[$column], true) ?? [];
            }
        }
        return $row;
    }

    /**
     * json_encode any JSONB column present in the payload before writing
     *
     * @param array $data
     * @return array
     */
    private function encodeJsonColumns(array $data): array
    {
        foreach (self::JSON_COLUMNS as $column) {
            if (isset($data[$column]) && is_array($data[$column])) {
                $data[$column] = json_encode($data[$column]);
            }
        }
        return $data;
    }
}
