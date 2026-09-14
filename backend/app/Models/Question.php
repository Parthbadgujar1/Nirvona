<?php

namespace Nirvona\Models;

/**
 * Question Model
 *
 * A single question belonging to an exam's question bank.
 */
class Question extends BaseModel
{
    public ?string $examId = null;
    public ?int $qNo = null;
    public ?string $subject = null;
    public ?string $topic = null;
    public ?string $questionText = null;
    public ?string $optionA = null;
    public ?string $optionB = null;
    public ?string $optionC = null;
    public ?string $optionD = null;
    public ?string $correctOption = null;
    public ?float $marks = 4;
    public ?float $negativeMarks = 1;
    public ?string $difficulty = 'medium';

    /**
     * Get options as an associative array keyed A-D
     *
     * @return array<string, ?string>
     */
    public function getOptions(): array
    {
        return [
            'A' => $this->optionA,
            'B' => $this->optionB,
            'C' => $this->optionC,
            'D' => $this->optionD,
        ];
    }
}
