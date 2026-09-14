<?php

namespace Nirvona\Models;

/**
 * ExamCandidate Model
 *
 * Attendance & seat allocation for a student registered for an exam.
 */
class ExamCandidate extends BaseModel
{
    public ?string $studentId = null;
    public ?string $examId = null;
    public ?string $studentName = null;
    public ?string $seatNo = null;
    public ?string $admitCardStatus = 'pending';
    public ?string $credentialStatus = 'pending';
    public ?string $attendance = 'pending';

    /**
     * Check if candidate is fully ready (admit card + credentials issued)
     *
     * @return bool
     */
    public function isReady(): bool
    {
        return in_array($this->admitCardStatus, ['generated', 'published', 'sent'], true)
            && $this->credentialStatus === 'assigned';
    }
}
