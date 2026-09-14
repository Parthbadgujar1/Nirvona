<?php

namespace Nirvona\Repositories;

/**
 * SubjectRepository
 *
 * Data Access Layer for Subject model.
 */
class SubjectRepository extends BaseRepository
{
    protected string $table = 'subjects';

    /**
     * Get subjects for a course, in display order
     *
     * @param string $courseSlug
     * @return array
     */
    public function getByCourse(string $courseSlug): array
    {
        return $this->select(
            "SELECT * FROM {$this->table} WHERE courseSlug = ? ORDER BY orderIndex ASC",
            [$courseSlug]
        );
    }

    /**
     * Find a subject by its code within a course
     *
     * @param string $courseSlug
     * @param string $code
     * @return ?array
     */
    public function findByCode(string $courseSlug, string $code): ?array
    {
        return $this->selectOne(
            "SELECT * FROM {$this->table} WHERE courseSlug = ? AND code = ? LIMIT 1",
            [$courseSlug, $code]
        );
    }
}
