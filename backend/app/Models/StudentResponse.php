<?php

namespace Nirvona\Models;

/**
 * StudentResponse Model
 *
 * A student's full response sheet for an exam. `rows` is a list of
 * {qNo, subject, topic, markedOption, correctOption, status,
 * timeSpentSec, marks}.
 */
class StudentResponse extends BaseModel
{
    public ?string $examId = null;
    public ?string $studentId = null;
    public array $rows = [];
    public ?string $validation = 'pending';
    public ?string $processing = 'queued';
    public ?string $uploadedAt = null;

    /**
     * Check if the response sheet has finished evaluation
     *
     * @return bool
     */
    public function isEvaluated(): bool
    {
        return $this->processing === 'evaluated';
    }

    /**
     * Count rows by status (correct/incorrect/unattempted)
     *
     * @return array<string, int>
     */
    public function getSummary(): array
    {
        $summary = ['correct' => 0, 'incorrect' => 0, 'unattempted' => 0];
        foreach ($this->rows as $row) {
            $status = $row['status'] ?? null;
            if (isset($summary[$status])) {
                $summary[$status]++;
            }
        }
        return $summary;
    }
}
