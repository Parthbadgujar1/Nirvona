<?php

namespace Nirvona\Services;

use Nirvona\Repositories\ResultRepository;
use Nirvona\Repositories\ExamRepository;
use Nirvona\Repositories\StudentRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * ResultService
 *
 * Handles exam result processing and analytics with error isolation.
 */
class ResultService extends BaseService
{
    private ResultRepository $resultRepository;
    private ExamRepository $examRepository;
    private StudentRepository $studentRepository;

    public function __construct(
        ResultRepository $resultRepository,
        ExamRepository $examRepository,
        StudentRepository $studentRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->resultRepository = $resultRepository;
        $this->examRepository = $examRepository;
        $this->studentRepository = $studentRepository;
    }

    /**
     * Calculate and store result
     *
     * @param array $resultData Result data
     * @return array Success status
     */
    public function calculateResult(array $resultData): array
    {
        return $this->executeWithFallback(
            function () use ($resultData) {
                $errors = $this->validate($resultData, [
                    'studentId' => ['required'],
                    'examId' => ['required'],
                    'score' => ['required', 'numeric'],
                    'maxScore' => ['required', 'numeric'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'ResultService',
                        false
                    );
                }

                // Check if result already exists
                $existing = $this->resultRepository->getStudentExamResult(
                    $resultData['studentId'],
                    $resultData['examId']
                );

                if ($existing) {
                    // Update existing
                    $this->resultRepository->update($existing['id'], $resultData);
                    $result = $this->resultRepository->getById($existing['id']);
                } else {
                    // Create new
                    $result = $this->resultRepository->create($resultData + [
                        'status' => 'processing',
                        'date' => date('Y-m-d H:i:s'),
                    ]);
                }

                $this->auditLog('CALCULATE_RESULT', 'Result', $result['id'], [
                    'studentId' => $resultData['studentId'],
                    'examId' => $resultData['examId'],
                    'score' => $resultData['score'],
                ]);

                return [
                    'success' => true,
                    'data' => $result,
                    'message' => 'Result calculated successfully',
                ];
            },
            null,
            'calculateResult'
        );
    }

    /**
     * Get result by ID
     *
     * @param string $resultId
     * @return array Result data
     */
    public function getResult(string $resultId): array
    {
        return $this->executeWithFallback(
            function () use ($resultId) {
                $result = $this->resultRepository->getById($resultId);

                if (!$result) {
                    throw new ServiceException(
                        "Result not found: {$resultId}",
                        'ResultService',
                        false
                    );
                }

                return [
                    'success' => true,
                    'data' => $result,
                ];
            },
            ['success' => false, 'error' => 'Unable to fetch result'],
            'getResult'
        );
    }

    /**
     * Get student's results
     *
     * @param string $studentId
     * @return array List of results
     */
    public function getStudentResults(string $studentId): array
    {
        return $this->executeWithFallback(
            function () use ($studentId) {
                return [
                    'success' => true,
                    'data' => $this->resultRepository->getByStudent($studentId),
                ];
            },
            ['success' => true, 'data' => []],
            'getStudentResults'
        );
    }

    /**
     * Get exam leaderboard
     *
     * @param string $examId
     * @return array Leaderboard data
     */
    public function getLeaderboard(string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($examId) {
                $leaderboard = $this->resultRepository->getLeaderboard($examId);

                return [
                    'success' => true,
                    'data' => $leaderboard,
                ];
            },
            ['success' => true, 'data' => []],
            'getLeaderboard'
        );
    }

    /**
     * Get performance analytics for student
     *
     * @param string $studentId
     * @param string $courseSlug
     * @return array Analytics data
     */
    public function getPerformanceAnalytics(string $studentId, string $courseSlug): array
    {
        return $this->executeWithFallback(
            function () use ($studentId, $courseSlug) {
                $analytics = $this->resultRepository->getPerformanceAnalytics(
                    $studentId,
                    $courseSlug
                );

                return [
                    'success' => true,
                    'data' => $analytics,
                ];
            },
            ['success' => true, 'data' => []],
            'getPerformanceAnalytics'
        );
    }

    /**
     * Publish results for exam
     *
     * @param string $examId
     * @return array Success status
     */
    public function publishExamResults(string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($examId) {
                // Update all results for exam to published
                $this->resultRepository->db->prepare(
                    "UPDATE results SET status = 'published' WHERE examId = ?"
                )->execute([$examId]);

                $this->auditLog('PUBLISH_EXAM_RESULTS', 'Exam', $examId, []);

                return [
                    'success' => true,
                    'message' => 'All results published successfully',
                ];
            },
            null,
            'publishExamResults'
        );
    }
}
