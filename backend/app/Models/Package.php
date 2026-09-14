<?php

namespace Nirvona\Models;

/**
 * Package Model
 *
 * Represents a purchasable subscription/test-series plan for a course.
 */
class Package extends BaseModel
{
    public ?string $courseSlug = null;
    public ?string $name = null;
    public ?string $duration = null;
    public ?string $durationLabel = null;
    public ?int $durationMonths = null;
    public ?float $price = null;
    public ?float $originalPrice = null;
    public ?int $discountPercent = 0;
    public ?int $tests = 0;
    public ?bool $recommended = false;
    public ?string $tagline = null;
    public array $features = [];
    public array $benefits = [];
    public array $includes = [];
    public ?string $status = 'active';

    /**
     * Get the discount amount in currency units
     *
     * @return float
     */
    public function getDiscountAmount(): float
    {
        if (!$this->originalPrice) {
            return 0.0;
        }
        return max(0.0, $this->originalPrice - ($this->price ?? 0));
    }
}
