<?php

namespace Nirvona\Models;

/**
 * AnswerKey Model
 *
 * The answer key for an exam. `entries` is a list of
 * {qNo, subject, topic, correctOption, marks, negative} rows.
 */
class AnswerKey extends BaseModel
{
    public ?string $examId = null;
    public ?int $totalQuestions = 0;
    public array $entries = [];
    public ?string $status = 'draft';
    public ?string $uploadedAt = null;
    public ?string $publishedAt = null;

    /**
     * Check if the answer key is visible to students
     *
     * @return bool
     */
    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    /**
     * Look up the correct option for a question number
     *
     * @param int $qNo
     * @return ?string
     */
    public function getCorrectOption(int $qNo): ?string
    {
        foreach ($this->entries as $entry) {
            if (($entry['qNo'] ?? null) === $qNo) {
                return $entry['correctOption'] ?? null;
            }
        }
        return null;
    }
}
