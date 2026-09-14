<?php

namespace Nirvona\Models;

/**
 * Exam Model
 *
 * Represents an examination in the system.
 */
class Exam extends BaseModel
{
    public ?string $name = null;
    public ?string $courseSlug = null;
    public ?string $date = null;
    public ?int $durationMinutes = null;
    public ?int $totalQuestions = null;
    public ?int $totalMarks = null;
    public ?string $centreId = null;
    public ?string $status = 'draft';
    public ?int $candidates = 0;
    public ?int $admitCardsGenerated = 0;
    public ?int $credentialsAssigned = 0;
    public ?string $syllabusScope = null;
    public ?string $reportingTime = null;
    public ?string $examTime = null;

    /**
     * Check if exam is scheduled
     *
     * @return bool
     */
    public function isScheduled(): bool
    {
        return $this->status === 'scheduled' && strtotime($this->date) > time();
    }

    /**
     * Check if exam is ongoing
     *
     * @return bool
     */
    public function isOngoing(): bool
    {
        return $this->status === 'ongoing';
    }

    /**
     * Check if results are published
     *
     * @return bool
     */
    public function isResultsPublished(): bool
    {
        return $this->status === 'result-published';
    }

    /**
     * Get progress percentage
     *
     * @return int
     */
    public function getProgressPercentage(): int
    {
        if ($this->candidates === 0) {
            return 0;
        }
        return (int) (($this->admitCardsGenerated / $this->candidates) * 100);
    }
}
