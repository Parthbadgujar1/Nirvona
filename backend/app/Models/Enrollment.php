<?php

namespace Nirvona\Models;

/**
 * Enrollment Model
 *
 * Represents a student's enrollment into a course via a purchased
 * package.
 */
class Enrollment extends BaseModel
{
    public ?string $studentId = null;
    public ?string $courseSlug = null;
    public ?string $packageId = null;
    public ?string $paymentId = null;
    public ?string $startDate = null;
    public ?string $endDate = null;
    public ?string $status = 'active';
    public ?int $testsTaken = 0;
    public ?int $testsTotal = 0;

    /**
     * Check if enrollment is currently active
     *
     * @return bool
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && strtotime($this->endDate ?? 'now') >= time();
    }

    /**
     * Get test completion percentage
     *
     * @return int
     */
    public function getCompletionPercentage(): int
    {
        if (!$this->testsTotal) {
            return 0;
        }
        return (int) round(($this->testsTaken / $this->testsTotal) * 100);
    }
}
