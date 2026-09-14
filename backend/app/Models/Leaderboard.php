<?php

namespace Nirvona\Models;

/**
 * Leaderboard Model
 *
 * A single row of a precomputed leaderboard snapshot (per exam, per
 * course, or an all-time cohort - see `period`).
 */
class Leaderboard extends BaseModel
{
    public ?string $examId = null;
    public ?string $courseSlug = null;
    public ?string $studentId = null;
    public ?string $studentName = null;
    public ?string $className = null;
    public ?int $rank = null;
    public ?float $score = null;
    public ?float $percentage = null;
    public ?float $avgPercentage = null;
    public ?int $totalExams = 0;
    public ?int $bestRank = null;
    public ?string $period = 'exam';
    public ?string $generatedAt = null;

    /**
     * Check if this entry is a top-3 podium finish
     *
     * @return bool
     */
    public function isTopThree(): bool
    {
        return ($this->rank ?? 0) > 0 && $this->rank <= 3;
    }
}
