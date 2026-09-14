<?php

namespace Nirvona\Repositories;

/**
 * SyllabusRepository
 *
 * Data Access Layer for the syllabus table (SyllabusUnit rows).
 */
class SyllabusRepository extends BaseRepository
{
    protected string $table = 'syllabus';

    /**
     * Get the full syllabus for a course, in display order.
     * `topics` (JSONB) is decoded back into a PHP array for each row.
     *
     * @param string $courseSlug
     * @return array
     */
    public function getByCourse(string $courseSlug): array
    {
        $rows = $this->select(
            "SELECT * FROM {$this->table} WHERE courseSlug = ? ORDER BY orderIndex ASC",
            [$courseSlug]
        );

        return array_map(function (array $row) {
            $row['topics'] = is_string($row['topics'] ?? null)
                ? (json_decode($row['topics'], true) ?? [])
                : ($row['topics'] ?? []);
            return $row;
        }, $rows);
    }

    /**
     * Create a syllabus unit, JSON-encoding the topics array
     *
     * @param array $data
     * @return array
     */
    public function create(array $data): array
    {
        if (isset($data['topics']) && is_array($data['topics'])) {
            $data['topics'] = json_encode($data['topics']);
        }
        return parent::create($data);
    }
}
