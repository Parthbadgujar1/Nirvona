<?php

namespace Nirvona\Models;

/**
 * ResultAnalysis Model
 *
 * Cached/derived performance analysis for a student within a course -
 * backing store for the frontend's `PerformanceAnalysis` type.
 */
class ResultAnalysis extends BaseModel
{
    public ?string $studentId = null;
    public ?string $courseSlug = null;
    public array $scoreTrend = [];
    public array $rankTrend = [];
    public array $accuracyTrend = [];
    public array $subjectComparison = [];
    public array $strengths = [];
    public array $weaknesses = [];
    public array $improvements = [];
    public array $timeDistribution = [];
    public ?string $summary = null;
    public ?float $improvementPercent = 0;
    public ?string $generatedAt = null;
}
