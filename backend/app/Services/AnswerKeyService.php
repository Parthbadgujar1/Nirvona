<?php

namespace Nirvona\Services;

use Nirvona\Repositories\AnswerKeyRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * AnswerKeyService
 *
 * Handles answer key upload & publishing with error isolation.
 */
class AnswerKeyService extends BaseService
{
    private AnswerKeyRepository $answerKeyRepository;

    public function __construct(
        AnswerKeyRepository $answerKeyRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->answerKeyRepository = $answerKeyRepository;
    }

    /**
     * Get the answer key for an exam - only returns it if published,
     * unless $includeUnpublished (admin view) is set.
     *
     * @param string $examId
     * @param bool $includeUnpublished
     * @return array
     */
    public function getForExam(string $examId, bool $includeUnpublished = false): array
    {
        return $this->executeWithFallback(
            function () use ($examId, $includeUnpublished) {
                $key = $this->answerKeyRepository->findByExam($examId);

                if (!$key) {
                    throw new ServiceException("Answer key not found for exam: {$examId}", 'AnswerKeyService', false);
                }

                if (!$includeUnpublished && $key['status'] !== 'published') {
                    throw new ServiceException("Answer key not yet published", 'AnswerKeyService', false);
                }

                return ['success' => true, 'data' => $key];
            },
            ['success' => false, 'error' => 'Unable to fetch answer key'],
            'getAnswerKeyForExam'
        );
    }

    /**
     * Upload/replace the answer key for an exam
     *
     * @param string $examId
     * @param array $entries List of {qNo, subject, topic, correctOption, marks, negative}
     * @return array
     */
    public function upload(string $examId, array $entries): array
    {
        return $this->executeWithFallback(
            function () use ($examId, $entries) {
                if (empty($entries)) {
                    throw new ServiceException("Answer key entries are required", 'AnswerKeyService', false);
                }

                $key = $this->answerKeyRepository->upsertForExam($examId, $entries);

                $this->auditLog('UPLOAD', 'AnswerKey', $examId, ['totalQuestions' => count($entries)]);

                return ['success' => true, 'data' => $key, 'message' => 'Answer key uploaded successfully'];
            },
            [
                'success' => false,
                'error' => [
                    'code' => 'answer_key_upload_failed',
                    'message' => 'Could not save this answer key. Check the entries and try again.',
                ],
            ],
            'uploadAnswerKey'
        );
    }

    /**
     * Publish the answer key so students can view it
     *
     * @param string $examId
     * @return array
     */
    public function publish(string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($examId) {
                if (!$this->answerKeyRepository->findByExam($examId)) {
                    throw new ServiceException("Answer key not found for exam: {$examId}", 'AnswerKeyService', false);
                }

                $this->answerKeyRepository->publish($examId);
                $this->auditLog('PUBLISH', 'AnswerKey', $examId, []);

                return ['success' => true, 'message' => 'Answer key published successfully'];
            },
            [
                'success' => false,
                // Was a bare `null` fallback, which BaseService::executeWithFallback
                // replaces with its generic "Service temporarily unavailable"
                // message for *any* failure - including the entirely
                // ordinary case of publishing an answer key that was
                // deleted or never uploaded, which masked a clear,
                // actionable error behind a scary generic one.
                'error' => [
                    'code' => 'answer_key_not_found',
                    'message' => 'No answer key found for this exam. Upload one first.',
                ],
            ],
            'publishAnswerKey'
        );
    }

    /**
     * Unpublish the answer key, hiding it from candidates again.
     *
     * @param string $examId
     * @return array
     */
    public function unpublish(string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($examId) {
                if (!$this->answerKeyRepository->findByExam($examId)) {
                    throw new ServiceException("Answer key not found for exam: {$examId}", 'AnswerKeyService', false);
                }

                $this->answerKeyRepository->unpublish($examId);
                $this->auditLog('UNPUBLISH', 'AnswerKey', $examId, []);

                return ['success' => true, 'message' => 'Answer key unpublished successfully'];
            },
            [
                'success' => false,
                'error' => [
                    'code' => 'answer_key_not_found',
                    'message' => 'No answer key found for this exam.',
                ],
            ],
            'unpublishAnswerKey'
        );
    }

    /**
     * List every exam's answer key - the admin overview page.
     *
     * @return array
     */
    public function listAll(): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->answerKeyRepository->getAll()],
            ['success' => true, 'data' => []],
            'listAllAnswerKeys'
        );
    }
}
