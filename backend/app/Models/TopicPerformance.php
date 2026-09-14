<?php

namespace Nirvona\Models;

/**
 * TopicPerformance Model
 *
 * A student's accuracy rollup for a single topic within a course.
 */
class TopicPerformance extends BaseModel
{
    public ?string $studentId = null;
    public ?string $courseSlug = null;
    public ?string $subject = null;
    public ?string $topic = null;
    public ?float $accuracy = 0;
    public ?int $attempted = 0;
    public ?int $total = 0;
    public ?float $trend = 0;

    /**
     * Check if this topic is a weak area (low accuracy, meaningfully attempted)
     *
     * @return bool
     */
    public function isWeakArea(): bool
    {
        return $this->attempted >= 3 && ($this->accuracy ?? 0) < 50;
    }
}
