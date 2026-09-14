<?php

namespace Nirvona\Repositories;

/**
 * ExamCentreRepository
 *
 * Data Access Layer for ExamCentre model.
 */
class ExamCentreRepository extends BaseRepository
{
    protected string $table = 'exam_centres';

    /**
     * Get all active centres
     *
     * @return array
     */
    public function getActive(): array
    {
        return $this->select(
            "SELECT * FROM {$this->table} WHERE status = 'active' ORDER BY name"
        );
    }

    /**
     * Get centres in a city
     *
     * @param string $city
     * @return array
     */
    public function getByCity(string $city): array
    {
        return $this->select(
            "SELECT * FROM {$this->table} WHERE city = ? AND status = 'active'",
            [$city]
        );
    }

    /**
     * Find a centre by its unique code
     *
     * @param string $code
     * @return ?array
     */
    public function findByCode(string $code): ?array
    {
        return $this->selectOne(
            "SELECT * FROM {$this->table} WHERE code = ? LIMIT 1",
            [$code]
        );
    }

    /**
     * Search centres by name, city, or code
     *
     * @param string $query
     * @return array
     */
    public function search(string $query): array
    {
        $query = '%' . $query . '%';
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE name ILIKE ? OR city ILIKE ? OR code ILIKE ?
             LIMIT 50",
            [$query, $query, $query]
        );
    }
}
