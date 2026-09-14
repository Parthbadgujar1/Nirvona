<?php

namespace Nirvona\Models;

/**
 * ExamCentre Model
 *
 * Represents a physical or virtual exam centre.
 */
class ExamCentre extends BaseModel
{
    public ?string $name = null;
    public ?string $code = null;
    public ?string $address = null;
    public ?string $city = null;
    public ?string $state = null;
    public ?string $pincode = null;
    public ?int $capacity = 0;
    public ?int $labs = 0;
    public ?string $contact = null;
    public ?string $status = 'active';

    /**
     * Check if centre is active
     *
     * @return bool
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
