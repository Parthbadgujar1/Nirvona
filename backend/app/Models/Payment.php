<?php

namespace Nirvona\Models;

/**
 * Payment Model
 *
 * Represents a payment transaction in the system.
 */
class Payment extends BaseModel
{
    public ?string $studentId = null;
    public ?string $studentName = null;
    public ?string $packageId = null;
    public ?string $packageName = null;
    public ?string $courseSlug = null;
    public ?float $amount = null;
    public ?float $discount = null;
    public ?float $tax = null;
    public ?float $total = null;
    public ?string $status = 'pending';
    public ?string $method = null;
    public ?string $transactionId = null;
    public ?string $date = null;
    public ?int $retryCount = 0;

    /**
     * Check if payment is successful
     *
     * @return bool
     */
    public function isSuccessful(): bool
    {
        return $this->status === 'successful';
    }

    /**
     * Check if payment is pending
     *
     * @return bool
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if payment is failed
     *
     * @return bool
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Check if payment can be retried
     *
     * @return bool
     */
    public function canRetry(): bool
    {
        return $this->isFailed() && $this->retryCount < 3;
    }

    /**
     * Get amount with currency formatting
     *
     * @return string
     */
    public function getFormattedAmount(): string
    {
        return '₹' . number_format($this->total ?? 0, 2);
    }
}
