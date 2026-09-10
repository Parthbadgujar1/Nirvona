<?php

namespace Nirvona\Models;

/**
 * Student Model
 *
 * Represents a student user in the system.
 * Attributes mirror the students table schema.
 */
class Student extends BaseModel
{
    public ?string $fullName = null;
    public ?string $email = null;
    public ?string $mobile = null;
    public ?string $dateOfBirth = null;
    public ?string $gender = null;
    public ?string $className = null;
    public ?string $school = null;
    public ?string $city = null;
    public ?string $state = null;
    public ?string $address = null;
    public ?string $status = 'active';
    public ?string $enrolledAt = null;
    public ?string $avatarUrl = null;
    public ?string $guardianName = null;
    public ?string $guardianMobile = null;

    /**
     * Check if student is active
     *
     * @return bool
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if student is suspended
     *
     * @return bool
     */
    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    /**
     * Get full address
     *
     * @return string
     */
    public function getFullAddress(): string
    {
        return trim("{$this->address}, {$this->city}, {$this->state}");
    }
}
