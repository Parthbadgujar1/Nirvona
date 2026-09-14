<?php

namespace Nirvona\Models;

/**
 * ExamCredential Model
 *
 * Exam-hall CBT login credential - deliberately separate from the
 * student's portal account. Holds a `passwordHash`, never the
 * plaintext password; the repository is responsible for hashing on
 * write and must never expose this field back to a client.
 */
class ExamCredential extends BaseModel
{
    public ?string $studentId = null;
    public ?string $examId = null;
    public ?string $studentName = null;
    public ?string $loginId = null;
    public ?string $passwordHash = null;
    public ?string $status = 'pending';
    public ?string $assignedAt = null;

    /**
     * Check if credential has been assigned to the student
     *
     * @return bool
     */
    public function isAssigned(): bool
    {
        return $this->status === 'assigned';
    }

    /**
     * Array representation with the password hash stripped - use this
     * (not toArray()) whenever a credential is returned to a client.
     *
     * @return array
     */
    public function toPublicArray(): array
    {
        $data = $this->toArray();
        unset($data['passwordHash']);
        return $data;
    }
}
