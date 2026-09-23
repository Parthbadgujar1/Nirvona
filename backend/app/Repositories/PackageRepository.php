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

    /** JSONB columns that need decoding after every read */
    private const JSON_COLUMNS = ['features', 'benefits', 'includes'];

    /**
     * Every read also computes `upcomingTests`: how many of the plan's
     * scheduled tests are still to come (dated today or later in IST, or not
     * yet dated). A student who buys mid-session is only ever offered - and
     * shown - the remaining tests, never the ones already conducted. Plans
     * without a schedule tier (legacy packages) get NULL.
     */
    private const SELECT_PACKAGES = "SELECT p.*,
            CASE WHEN p.tier IS NULL THEN NULL ELSE (
                SELECT COALESCE(SUM(ts.testCount), 0)::int FROM test_schedules ts
                 WHERE ts.courseSlug = p.courseSlug AND ts.tier = p.tier
                   AND (ts.examDate IS NULL OR ts.examDate >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date)
            ) END AS upcomingTests
        FROM packages p";

    /**
     * Public/purchase view of a package: for a tiered plan, `tests` is the
     * number of tests still to come rather than the season total.
     */
    private const PLAN_ORDER = "p.durationMonths ASC,
        CASE p.tier WHEN 'Basic' THEN 1 WHEN 'Pro' THEN 2 WHEN 'Pro Max' THEN 3 ELSE 4 END, p.price ASC";

    private function forPublic(array $row): array
    {
        $row = $this->decodeJsonColumns($row);
        if (isset($row['upcomingTests'])) {
            $row['upcomingTests'] = (int) $row['upcomingTests'];
            $row['tests'] = $row['upcomingTests'];
        }
        return $row;
    }

    /**
     * Get active packages for a course, cheapest first
     *
     * @param string $courseSlug
     * @return array
     */
    public function getByCourse(string $courseSlug): array
    {
        $rows = $this->select(
            self::SELECT_PACKAGES . "
             WHERE p.courseSlug = ? AND p.status = 'active'
             ORDER BY " . self::PLAN_ORDER,
            [$courseSlug]
        );
        return array_map([$this, 'forPublic'], $rows);
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
            self::SELECT_PACKAGES . "
             WHERE p.status = 'active'
             ORDER BY p.courseSlug ASC, " . self::PLAN_ORDER
        );
        return array_map([$this, 'forPublic'], $rows);
    }

    /**
     * Get every package regardless of status - for admin management.
     * getAllActive() is for the public catalogue only.
     *
     * @return array
     */
    public function getAllForAdmin(): array
    {
        // Admin view keeps the stored season total in `tests`; upcomingTests
        // is returned alongside it.
        $rows = $this->select(
            self::SELECT_PACKAGES . " ORDER BY p.courseSlug ASC, " . self::PLAN_ORDER
        );
        return array_map(function (array $row) {
            $row = $this->decodeJsonColumns($row);
            if (isset($row['upcomingTests'])) {
                $row['upcomingTests'] = (int) $row['upcomingTests'];
            }
            return $row;
        }, $rows);
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
        $row = $this->selectOne(self::SELECT_PACKAGES . " WHERE p.id = ? LIMIT 1", [$id]);
        return $row ? $this->forPublic($row) : null;
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

    /**
     * @param string $id
     * @param array $data
     * @return bool
     */
    public function update(string $id, array $data): bool
    {
        // BaseRepository::update() binds every value as-is - without this
        // override, passing a PHP array for features/benefits/includes
        // (as every other write path here does) hands PDO a raw array for
        // a JSONB column instead of a JSON string, which PDO can't bind at
        // all (create()/decodeJsonColumns() already handle this correctly;
        // this was the one write path that didn't).
        return parent::update($id, $this->encodeJsonColumns($data));
    }

    private function decodeJsonColumns(array $row): array
    {
        foreach (self::JSON_COLUMNS as $column) {
            if (isset($row[$column]) && is_string($row[$column])) {
                $row[$column] = json_decode($row[$column], true) ?? ($column === 'includes' ? [] : []);
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
