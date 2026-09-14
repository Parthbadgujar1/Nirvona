<?php

namespace Nirvona\Repositories;

/**
 * ResultAnalysisRepository
 *
 * Data Access Layer for ResultAnalysis model (cached performance
 * analysis per student per course). Several JSONB trend/array columns
 * are decoded/encoded on the way in and out.
 */
class ResultAnalysisRepository extends BaseRepository
{
    protected string $table = 'result_analysis';

    private const JSON_COLUMNS = [
        'scoreTrend', 'rankTrend', 'accuracyTrend', 'subjectComparison',
        'strengths', 'weaknesses', 'improvements', 'timeDistribution',
    ];

    /**
     * Find the cached analysis for a student within a course
     *
     * @param string $studentId
     * @param string $courseSlug
     * @return ?array
     */
    public function findByStudentAndCourse(string $studentId, string $courseSlug): ?array
    {
        $row = $this->selectOne(
            "SELECT * FROM {$this->table} WHERE studentId = ? AND courseSlug = ? LIMIT 1",
            [$studentId, $courseSlug]
        );
        return $row ? $this->decodeJsonColumns($row) : null;
    }

    /**
     * Create or replace the cached analysis for a student+course
     *
     * @param string $studentId
     * @param string $courseSlug
     * @param array $data Remaining ResultAnalysis fields
     * @return array
     */
    public function upsert(string $studentId, string $courseSlug, array $data): array
    {
        $existing = $this->selectOne(
            "SELECT id FROM {$this->table} WHERE studentId = ? AND courseSlug = ? LIMIT 1",
            [$studentId, $courseSlug]
        );

        $payload = $this->encodeJsonColumns($data);
        $payload['generatedAt'] = date('Y-m-d H:i:s');

        if ($existing) {
            $this->update($existing['id'], $payload);
        } else {
            $payload['studentId'] = $studentId;
            $payload['courseSlug'] = $courseSlug;
            parent::create($payload);
        }

        return $this->findByStudentAndCourse($studentId, $courseSlug);
    }

    private function decodeJsonColumns(array $row): array
    {
        foreach (self::JSON_COLUMNS as $column) {
            if (isset($row[$column]) && is_string($row[$column])) {
                $row[$column] = json_decode($row[$column], true) ?? [];
            }
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
