<?php

namespace Nirvona\Services;

use Nirvona\Repositories\QuestionRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * QuestionService
 *
 * Handles exam question-bank authoring with error isolation.
 */
class QuestionService extends BaseService
{
    private QuestionRepository $questionRepository;

    public function __construct(
        QuestionRepository $questionRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->questionRepository = $questionRepository;
    }

    /**
     * List questions for an exam, optionally filtered by subject
     *
     * @param string $examId
     * @param ?string $subject
     * @return array
     */
    public function getByExam(string $examId, ?string $subject = null): array
    {
        return $this->executeWithFallback(
            fn() => [
                'success' => true,
                'data' => $subject
                    ? $this->questionRepository->getByExamAndSubject($examId, $subject)
                    : $this->questionRepository->getByExam($examId),
            ],
            ['success' => true, 'data' => []],
            'getQuestionsByExam'
        );
    }

    /**
     * Create a single question
     *
     * @param array $data
     * @return array
     */
    public function create(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $errors = $this->validate($data, [
                    'examId' => ['required'],
                    'qNo' => ['required', 'numeric'],
                    'questionText' => ['required', 'string'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'QuestionService',
                        false
                    );
                }

                if ($this->questionRepository->findByExamAndNumber($data['examId'], (int) $data['qNo'])) {
                    throw new ServiceException(
                        "Question {$data['qNo']} already exists for this exam",
                        'QuestionService',
                        false
                    );
                }

                $question = $this->questionRepository->create($data);

                $this->auditLog('CREATE', 'Question', $question['id'], [
                    'examId' => $data['examId'],
                    'qNo' => $data['qNo'],
                ]);

                return ['success' => true, 'data' => $question, 'message' => 'Question created successfully'];
            },
            null,
            'createQuestion'
        );
    }

    /**
     * Bulk import questions for an exam (question-bank upload)
     *
     * @param string $examId
     * @param array $questions List of question rows (qNo, subject, topic, questionText, optionA-D, correctOption, marks, negativeMarks)
     * @return array
     */
    public function bulkImport(string $examId, array $questions): array
    {
        return $this->executeWithFallback(
            function () use ($examId, $questions) {
                if (empty($questions)) {
                    throw new ServiceException("No questions provided", 'QuestionService', false);
                }

                $created = [];
                $skipped = [];

                foreach ($questions as $row) {
                    $row['examId'] = $examId;

                    if (empty($row['qNo']) || empty($row['questionText'])) {
                        $skipped[] = $row['qNo'] ?? null;
                        continue;
                    }

                    if ($this->questionRepository->findByExamAndNumber($examId, (int) $row['qNo'])) {
                        $skipped[] = $row['qNo'];
                        continue;
                    }

                    $created[] = $this->questionRepository->create($row);
                }

                $this->auditLog('BULK_IMPORT', 'Question', $examId, [
                    'created' => count($created),
                    'skipped' => count($skipped),
                ]);

                return [
                    'success' => true,
                    'data' => [
                        'created' => count($created),
                        'skipped' => $skipped,
                        'questions' => $created,
                    ],
                    'message' => count($created) . ' question(s) imported, ' . count($skipped) . ' skipped',
                ];
            },
            null,
            'bulkImportQuestions'
        );
    }

    /**
     * Update a question
     *
     * @param string $id
     * @param array $data
     * @return array
     */
    public function update(string $id, array $data): array
    {
        return $this->executeWithFallback(
            function () use ($id, $data) {
                if (!$this->questionRepository->getById($id)) {
                    throw new ServiceException("Question not found: {$id}", 'QuestionService', false);
                }

                $this->questionRepository->update($id, $data);
                $this->auditLog('UPDATE', 'Question', $id, ['fields' => array_keys($data)]);

                return ['success' => true, 'data' => $this->questionRepository->getById($id), 'message' => 'Question updated successfully'];
            },
            null,
            'updateQuestion'
        );
    }

    /**
     * Delete a question
     *
     * @param string $id
     * @return array
     */
    public function delete(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                if (!$this->questionRepository->getById($id)) {
                    throw new ServiceException("Question not found: {$id}", 'QuestionService', false);
                }

                $this->questionRepository->delete($id);
                $this->auditLog('DELETE', 'Question', $id, []);

                return ['success' => true, 'message' => 'Question deleted successfully'];
            },
            null,
            'deleteQuestion'
        );
    }
}
