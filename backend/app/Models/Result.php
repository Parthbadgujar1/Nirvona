<?php

namespace Nirvona\Models;

/**
 * Result Model
 *
 * Represents an exam result for a student.
 */
class Result extends BaseModel
{
    public ?string $studentId = null;
    public ?string $studentName = null;
    public ?string $examId = null;
    public ?string $examName = null;
    public ?string $courseSlug = null;
    public ?float $score = null;
    public ?float $maxScore = null;
    public ?float $percentage = null;
    public ?int $rank = null;
    public ?int $totalCandidates = null;
    public ?float $percentile = null;
    public ?float $accuracy = null;
    public ?int $correct = null;
    public ?int $incorrect = null;
    public ?int $unattempted = null;
    public ?int $timeTakenMin = null;
    public ?string $status = 'processing';
    public ?float $topPerformerScore = null;
    public ?float $averageScore = null;
    public ?string $date = null;

    /**
     * Check if result is published
     *
     * @return bool
     */
    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    /**
     * Get grade based on percentage
     *
     * @return string
     */
    public function getGrade(): string
    {
        if (!$this->percentage) {
            return 'N/A';
        }

        return match (true) {
            $this->percentage >= 90 => 'A+',
            $this->percentage >= 80 => 'A',
            $this->percentage >= 70 => 'B',
            $this->percentage >= 60 => 'C',
            $this->percentage >= 50 => 'D',
            default => 'F',
        };
    }

    /**
     * Check if result is passing
     *
     * @return bool
     */
    public function isPassing(): bool
    {
        return ($this->percentage ?? 0) >= 50;
    }

    /**
     * Get performance status
     *
     * @return string
     */
    public function getPerformanceStatus(): string
    {
        if (!$this->percentile) {
            return 'N/A';
        }

        return match (true) {
            $this->percentile >= 90 => 'Excellent',
            $this->percentile >= 75 => 'Very Good',
            $this->percentile >= 60 => 'Good',
            $this->percentile >= 40 => 'Average',
            default => 'Below Average',
        };
    }
}
