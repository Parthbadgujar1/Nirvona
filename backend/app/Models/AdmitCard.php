<?php

namespace Nirvona\Models;

/**
 * AdmitCard Model
 *
 * Digital admit card issued to a student for an exam.
 */
class AdmitCard extends BaseModel
{
    public ?string $studentId = null;
    public ?string $examId = null;
    public ?string $rollNumber = null;
    public ?string $seatNo = null;
    public ?string $status = 'pending';
    public ?string $generatedAt = null;
    public ?string $publishedAt = null;

    /**
     * Check if the admit card has been published to the student
     *
     * @return bool
     */
    public function isPublished(): bool
    {
        return in_array($this->status, ['published', 'sent'], true);
    }
}
