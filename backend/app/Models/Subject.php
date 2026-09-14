<?php

namespace Nirvona\Models;

/**
 * Subject Model
 *
 * Represents a subject within a course (e.g. Physics under JEE).
 */
class Subject extends BaseModel
{
    public ?string $courseSlug = null;
    public ?string $code = null;
    public ?string $name = null;
    public ?string $color = null;
    public ?int $orderIndex = 0;
}
