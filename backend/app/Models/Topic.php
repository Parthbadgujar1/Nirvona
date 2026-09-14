<?php

namespace Nirvona\Models;

/**
 * Topic Model
 *
 * Curriculum topic catalogue entry (e.g. "Laws of Motion" under
 * Physics). Distinct from TopicPerformance, which tracks a student's
 * accuracy against a topic rather than the topic itself.
 */
class Topic extends BaseModel
{
    public ?string $subjectId = null;
    public ?string $courseSlug = null;
    public ?string $name = null;
    public ?string $unitTitle = null;
    public ?int $orderIndex = 0;
}
