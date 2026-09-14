<?php

namespace Nirvona\Models;

/**
 * Course Model
 *
 * Represents a course in the catalogue (e.g. JEE, NEET, Class 11/12).
 * Uses `slug` as its identity instead of BaseModel's UUID `id`.
 */
class Course extends BaseModel
{
    public ?string $slug = null;
    public ?string $name = null;
    public ?string $shortName = null;
    public ?string $tagline = null;
    public ?string $description = null;
    public array $audience = [];
    public ?int $maxDurationMonths = 12;
    public ?int $totalTests = 0;
    public ?string $accent = 'navy';
    public ?string $icon = null;
    public array $highlights = [];
    public array $examPattern = [];
    public array $patternNotes = [];
    public array $faqs = [];
    public array $stats = [];
    public ?string $status = 'active';

    /**
     * Check if course is published/active
     *
     * @return bool
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
