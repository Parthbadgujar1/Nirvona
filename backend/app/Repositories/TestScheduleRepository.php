<?php

namespace Nirvona\Repositories;

/**
 * TestScheduleRepository
 *
 * Read side of the per-plan test calendar. Only the columns safe to show
 * publicly are ever selected: the source calendar's own dates (`pwDate`)
 * stay in the database and are never returned.
 *
 * "Upcoming" is evaluated in IST: a test dated today is still upcoming, a
 * test not yet given a date (e.g. an announced-later series) is upcoming.
 */
class TestScheduleRepository extends BaseRepository
{
    protected string $table = 'test_schedules';

    private const PUBLIC_COLUMNS = 'sNo, testName, examDate, testNumber, testType, testPattern, mode, subjects, note, testCount';
    private const UPCOMING = "(examDate IS NULL OR examDate >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date)";

    /**
     * @return array<int, array<string, mixed>>
     */
    public function upcoming(string $courseSlug, string $tier): array
    {
        $rows = $this->select(
            "SELECT " . self::PUBLIC_COLUMNS . " FROM {$this->table}
             WHERE courseSlug = ? AND tier = ? AND " . self::UPCOMING . "
             ORDER BY examDate ASC NULLS LAST, sNo ASC",
            [$courseSlug, $tier]
        );
        return array_map(function (array $row) {
            if (is_string($row['subjects'] ?? null)) {
                $row['subjects'] = json_decode($row['subjects'], true) ?: new \stdClass();
            }
            $row['examDate'] = $row['examDate'] ?? null;
            return $row;
        }, $rows);
    }

    /**
     * The plans that have a published calendar for a course (with the number
     * of tests still to come in each) - drives the public schedule page's
     * plan tabs.
     *
     * @return array<int, array{tier: string, upcomingTests: int}>
     */
    public function tiersWithUpcoming(string $courseSlug): array
    {
        $rows = $this->select(
            "SELECT tier, COALESCE(SUM(testCount) FILTER (WHERE " . self::UPCOMING . "), 0)::int AS upcomingTests
             FROM {$this->table} WHERE courseSlug = ? GROUP BY tier",
            [$courseSlug]
        );
        return array_map(fn($r) => ['tier' => $r['tier'], 'upcomingTests' => (int) $r['upcomingTests']], $rows);
    }
}
