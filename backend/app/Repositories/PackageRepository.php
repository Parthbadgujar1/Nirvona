<?php

namespace Nirvona\Repositories;

/**
 * PackageRepository
 *
 * Data Access Layer for Package model.
 */
class PackageRepository extends BaseRepository
{
    protected string $table = 'packages';

    /** JSON columns that need decoding after every read */
    private const JSON_COLUMNS = ['features', 'benefits', 'includes'];

    /**
     * Get active packages for a course, cheapest first
     *
     * @param string $courseSlug
     * @return array
     */
    public function getByCourse(string $courseSlug): array
    {
        $rows = $this->select(
            "SELECT * FROM {$this->table}
             WHERE courseSlug = ? AND status = 'active'
             ORDER BY durationMonths ASC",
            [$courseSlug]
        );
        return array_map([$this, 'decodeJsonColumns'], $rows);
    }

    /**
     * Get every active package across every course, cheapest first -
     * backs the public /packages "compare all programs" page, which
     * lists packages before a course has been chosen.
     *
     * @return array
     */
    public function getAllActive(): array
    {
        $rows = $this->select(
            "SELECT * FROM {$this->table}
             WHERE status = 'active'
             ORDER BY courseSlug ASC, durationMonths ASC"
        );
        return array_map([$this, 'decodeJsonColumns'], $rows);
    }

    /**
     * Get the recommended package for a course, if any
     *
     * @param string $courseSlug
     * @return ?array
     */
    public function getRecommended(string $courseSlug): ?array
    {
        $row = $this->selectOne(
            "SELECT * FROM {$this->table}
             WHERE courseSlug = ? AND recommended = TRUE AND status = 'active'
             LIMIT 1",
            [$courseSlug]
        );
        return $row ? $this->decodeJsonColumns($row) : null;
    }

    /**
     * @param string $id
     * @return ?array
     */
    public function getById(string $id): ?array
    {
        $row = parent::getById($id);
        return $row ? $this->decodeJsonColumns($row) : null;
    }

    /**
     * @param array $data
     * @return array
     */
    public function create(array $data): array
    {
        $created = parent::create($this->encodeJsonColumns($data));
        return $this->decodeJsonColumns($created);
    }

    private function decodeJsonColumns(array $row): array
    {
        foreach (self::JSON_COLUMNS as $column) {
            if (!array_key_exists($column, $row)) {
                continue;
            }
            // These columns are JSON NULL (no DB-side default - MySQL
            // doesn't allow a literal default on a JSON column the way
            // Postgres's JSONB did), so a row a caller created without
            // setting one comes back NULL rather than "[]"/"{}"; treat
            // that the same as an empty array here so every consumer
            // still always gets a real array, never null.
            $row[$column] = is_string($row[$column])
                ? (json_decode($row[$column], true) ?? [])
                : ($row[$column] ?? []);
        }
        return $row;
    }

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
