<?php

namespace Nirvona\Repositories;

/**
 * TopicRepository
 *
 * Data Access Layer for Topic model (curriculum topic catalogue).
 */
class TopicRepository extends BaseRepository
{
    protected string $table = 'topics';

    /**
     * Get topics for a subject, in display order
     *
     * @param string $subjectId
     * @return array
     */
    public function getBySubject(string $subjectId): array
    {
        return $this->select(
            "SELECT * FROM {$this->table} WHERE subjectId = ? ORDER BY orderIndex ASC",
            [$subjectId]
        );
    }

    /**
     * Get all topics for a course
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
     * Search topics by name within a course
     *
     * @param string $courseSlug
     * @param string $query
     * @return array
     */
    public function search(string $courseSlug, string $query): array
    {
        $query = '%' . $query . '%';
        return $this->select(
            "SELECT * FROM {$this->table} WHERE courseSlug = ? AND name LIKE ? LIMIT 50",
            [$courseSlug, $query]
        );
    }
}
