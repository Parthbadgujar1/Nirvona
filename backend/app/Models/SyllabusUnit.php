<?php

namespace Nirvona\Models;

/**
 * SyllabusUnit Model
 *
 * One unit of a subject's syllabus, with its topic titles as a list
 * (mirrors the frontend's `SyllabusUnit.units[]` entries).
 */
class SyllabusUnit extends BaseModel
{
    public ?string $courseSlug = null;
    public ?string $subjectId = null;
    public ?string $subject = null;
    public ?string $unitTitle = null;
    public array $topics = [];
    public ?int $orderIndex = 0;
}
