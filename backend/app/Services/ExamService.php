<?php

namespace Nirvona\Services;

use Nirvona\Repositories\ExamRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * ExamService
 *
 * Handles exam management with error isolation.
 * Extends BaseService for automatic error handling.
 */
class ExamService extends BaseService
{
    private ExamRepository $examRepository;

    public function __construct(
        ExamRepository $examRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->examRepository = $examRepository;
    }

    /**
     * Schedule exam
     *
     * @param array $data Exam data
     * @return array Success status with exam ID
     */
    public function scheduleExam(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $errors = $this->validate($data, [
                    'name' => ['required', 'string'],
                    'courseSlug' => ['required'],
                    'date' => ['required'],
                    'totalQuestions' => ['required', 'numeric'],
                    'totalMarks' => ['required', 'numeric'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'ExamService',
                        false
                    );
                }

                $exam = $this->examRepository->create([
                    'name' => $data['name'],
                    'courseSlug' => $data['courseSlug'],
                    'date' => $data['date'],
                    'durationMinutes' => $data['durationMinutes'] ?? 120,
                    'totalQuestions' => $data['totalQuestions'],
                    'totalMarks' => $data['totalMarks'],
                    'status' => 'scheduled',
                    'centreId' => $data['centreId'] ?? null,
                ]);

                $this->auditLog('SCHEDULE', 'Exam', $exam['id'], [
                    'name' => $data['name'],
                    'date' => $data['date'],
                ]);

                return [
                    'success' => true,
                    'data' => $exam,
                    'message' => 'Exam scheduled successfully',
                ];
            },
            null,
            'scheduleExam'
        );
    }

    /**
     * Get exam by ID
     *
     * @param string $examId
     * @return array Exam data or error
     */
    public function getExam(string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($examId) {
                $exam = $this->examRepository->getWithDetails($examId);

                if (!$exam) {
                    throw new ServiceException(
                        "Exam not found: {$examId}",
                        'ExamService',
                        false
                    );
                }

                return [
                    'success' => true,
                    'data' => $exam,
                ];
            },
            ['success' => false, 'error' => 'Unable to fetch exam'],
            'getExam'
        );
    }

    /**
     * Get upcoming exams
     *
     * @return array List of exams
     */
    public function getUpcomingExams(): array
    {
        return $this->executeWithFallback(
            function () {
                return [
                    'success' => true,
                    'data' => $this->examRepository->getUpcoming(),
                ];
            },
            ['success' => true, 'data' => []],
            'getUpcomingExams'
        );
    }

    /**
     * Publish exam result
     *
     * @param string $examId
     * @return array Success status
     */
    public function publishResult(string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($examId) {
                $exam = $this->examRepository->getById($examId);

                if (!$exam) {
                    throw new ServiceException(
                        "Exam not found: {$examId}",
                        'ExamService',
                        false
                    );
                }

                $this->examRepository->update($examId, ['status' => 'result-published']);

                $this->auditLog('PUBLISH_RESULT', 'Exam', $examId, [
                    'examName' => $exam['name'],
                ]);

                return [
                    'success' => true,
                    'message' => 'Results published successfully',
                ];
            },
            null,
            'publishResult'
        );
    }

    /**
     * Get exams by course
     *
     * @param string $courseSlug
     * @return array List of exams
     */
    public function getExamsByCourse(string $courseSlug): array
    {
        return $this->executeWithFallback(
            function () use ($courseSlug) {
                return [
                    'success' => true,
                    'data' => $this->examRepository->getByCourse($courseSlug),
                ];
            },
            ['success' => true, 'data' => []],
            'getExamsByCourse'
        );
    }

    /**
     * Get exam statistics
     *
     * @param string $examId
     * @return array Exam statistics
     */
    public function getExamStats(string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($examId) {
                $exam = $this->examRepository->getById($examId);

                if (!$exam) {
                    throw new ServiceException(
                        "Exam not found: {$examId}",
                        'ExamService',
                        false
                    );
                }

                return [
                    'success' => true,
                    'data' => [
                        'totalCandidates' => $exam['candidates'] ?? 0,
                        'admitCardsGenerated' => $exam['admitCardsGenerated'] ?? 0,
                        'credentialsAssigned' => $exam['credentialsAssigned'] ?? 0,
                        'progressPercentage' => ($exam['candidates'] > 0)
                            ? (int)(($exam['admitCardsGenerated'] / $exam['candidates']) * 100)
                            : 0,
                    ],
                ];
            },
            ['success' => false, 'error' => 'Unable to fetch exam statistics'],
            'getExamStats'
        );
    }
}
