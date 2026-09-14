<?php

namespace Nirvona\Services;

use Nirvona\Repositories\ResultRepository;
use Nirvona\Repositories\ExamRepository;
use Nirvona\Repositories\StudentRepository;
use Nirvona\Repositories\ResultAnalysisRepository;
use Nirvona\Repositories\LeaderboardRepository;
use Nirvona\Repositories\TopicPerformanceRepository;
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
    private ResultAnalysisRepository $resultAnalysisRepository;
    private LeaderboardRepository $leaderboardRepository;
    private TopicPerformanceRepository $topicPerformanceRepository;

    public function __construct(
        ResultRepository $resultRepository,
        ExamRepository $examRepository,
        StudentRepository $studentRepository,
        ResultAnalysisRepository $resultAnalysisRepository,
        LeaderboardRepository $leaderboardRepository,
        TopicPerformanceRepository $topicPerformanceRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->resultRepository = $resultRepository;
        $this->examRepository = $examRepository;
        $this->studentRepository = $studentRepository;
        $this->resultAnalysisRepository = $resultAnalysisRepository;
        $this->leaderboardRepository = $leaderboardRepository;
        $this->topicPerformanceRepository = $topicPerformanceRepository;
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
     * Get one student's result for one specific exam - what "View
     * result" actually needs (a student/exam pair), not a bare result
     * id. Every "View result" link across the app passed an examId
     * into the by-id endpoint above (`getResult`), which looks up a
     * completely different primary key - this is the real endpoint
     * that should back that link instead.
     *
     * @param string $studentId
     * @param string $examId
     * @return array
     */
    public function getForStudentExam(string $studentId, string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($studentId, $examId) {
                $result = $this->resultRepository->getStudentExamResult($studentId, $examId);

                if (!$result) {
                    throw new ServiceException(
                        "No result found for this student/exam",
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
            'getResultForStudentExam'
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
     * Get a student's most recent result
     *
     * @param string $studentId
     * @return array
     */
    public function getLatestResult(string $studentId): array
    {
        return $this->executeWithFallback(
            function () use ($studentId) {
                $results = $this->resultRepository->getByStudent($studentId);
                $latest = $results[0] ?? null;

                if (!$latest) {
                    throw new ServiceException("No results found for this student", 'ResultService', false);
                }

                return ['success' => true, 'data' => $latest];
            },
            ['success' => false, 'error' => 'No results found'],
            'getLatestResult'
        );
    }

    /**
     * Get exam leaderboard. Prefers the precomputed Leaderboard snapshot
     * (built by ScoringService after evaluation); falls back to a live
     * aggregate query if nothing's been scored/cached yet for this exam.
     *
     * @param string $examId
     * @return array Leaderboard data
     */
    public function getLeaderboard(string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($examId) {
                $cached = $this->leaderboardRepository->getByExam($examId);

                return [
                    'success' => true,
                    'data' => !empty($cached) ? $cached : $this->resultRepository->getLeaderboard($examId),
                ];
            },
            ['success' => true, 'data' => []],
            'getLeaderboard'
        );
    }

    /**
     * Get performance analytics for student. Prefers the cached
     * ResultAnalysis (built by ScoringService after evaluation); falls
     * back to a live aggregate query if nothing's been cached yet.
     *
     * @param string $studentId
     * @param string $courseSlug
     * @return array Analytics data
     */
    public function getPerformanceAnalytics(string $studentId, string $courseSlug): array
    {
        return $this->executeWithFallback(
            function () use ($studentId, $courseSlug) {
                $cached = $this->resultAnalysisRepository->findByStudentAndCourse($studentId, $courseSlug);

                return [
                    'success' => true,
                    'data' => $cached ?? $this->resultRepository->getPerformanceAnalytics($studentId, $courseSlug),
                ];
            },
            ['success' => true, 'data' => []],
            'getPerformanceAnalytics'
        );
    }

    /**
     * Get a student's topic-level performance within a course
     *
     * @param string $studentId
     * @param string $courseSlug
     * @return array
     */
    public function getTopicPerformance(string $studentId, string $courseSlug): array
    {
        return $this->executeWithFallback(
            fn() => [
                'success' => true,
                'data' => $this->topicPerformanceRepository->getByStudent($studentId, $courseSlug),
            ],
            ['success' => true, 'data' => []],
            'getTopicPerformance'
        );
    }

    /**
     * Publish results for exam
     *
     * @param string $examId
     * @return array Success status
     */
    /**
     * List every candidate's result for an exam, for the admin review
     * table (score, rank, percentile, status per student) - there was
     * no admin-facing listing endpoint at all before this, only
     * student-scoped and leaderboard-scoped ones.
     *
     * @param string $examId
     * @return array
     */
    public function getByExamForAdmin(string $examId): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->resultRepository->getByExam($examId)],
            ['success' => true, 'data' => []],
            'getResultsByExamForAdmin'
        );
    }

    public function publishExamResults(string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($examId) {
                $this->resultRepository->publishByExam($examId);

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
