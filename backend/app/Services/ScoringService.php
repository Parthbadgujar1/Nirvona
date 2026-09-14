<?php

namespace Nirvona\Services;

use Nirvona\Repositories\StudentResponseRepository;
use Nirvona\Repositories\AnswerKeyRepository;
use Nirvona\Repositories\ExamRepository;
use Nirvona\Repositories\ResultRepository;
use Nirvona\Repositories\TopicPerformanceRepository;
use Nirvona\Repositories\ResultAnalysisRepository;
use Nirvona\Repositories\LeaderboardRepository;
use Nirvona\Repositories\StudentRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * ScoringService
 *
 * The background-job logic previously missing entirely: turns an
 * uploaded StudentResponse + the exam's AnswerKey into a Result, rolls
 * per-topic accuracy into TopicPerformance, refreshes the student's
 * cached ResultAnalysis, and (re)builds the exam's Leaderboard.
 *
 * This is meant to run as a job (triggered by an admin action for now
 * via ScoringController - see routes/admin.php), not inline on upload,
 * since scoring one student can mean rewriting a whole exam's ranking.
 *
 * Known limitation: TopicPerformance deltas are only added once per
 * response (guarded by the response's own `processing` status) rather
 * than fully recomputed from scratch on re-evaluation, so re-scoring an
 * already-evaluated response after a manual correction will not undo
 * the old contribution. Rebuilding it as a strict recompute-from-all-
 * responses aggregate is the correct long-term fix but is out of scope
 * here.
 */
class ScoringService extends BaseService
{
    private StudentResponseRepository $studentResponseRepository;
    private AnswerKeyRepository $answerKeyRepository;
    private ExamRepository $examRepository;
    private ResultRepository $resultRepository;
    private TopicPerformanceRepository $topicPerformanceRepository;
    private ResultAnalysisRepository $resultAnalysisRepository;
    private LeaderboardRepository $leaderboardRepository;
    private StudentRepository $studentRepository;

    public function __construct(
        StudentResponseRepository $studentResponseRepository,
        AnswerKeyRepository $answerKeyRepository,
        ExamRepository $examRepository,
        ResultRepository $resultRepository,
        TopicPerformanceRepository $topicPerformanceRepository,
        ResultAnalysisRepository $resultAnalysisRepository,
        LeaderboardRepository $leaderboardRepository,
        StudentRepository $studentRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->studentResponseRepository = $studentResponseRepository;
        $this->answerKeyRepository = $answerKeyRepository;
        $this->examRepository = $examRepository;
        $this->resultRepository = $resultRepository;
        $this->topicPerformanceRepository = $topicPerformanceRepository;
        $this->resultAnalysisRepository = $resultAnalysisRepository;
        $this->leaderboardRepository = $leaderboardRepository;
        $this->studentRepository = $studentRepository;
    }

    /**
     * Score one student's response sheet against the exam's answer key.
     * Creates/updates their Result and TopicPerformance rows, then
     * refreshes their cached ResultAnalysis. Does NOT rebuild the
     * leaderboard - call evaluateExam() (or regenerateLeaderboard()) once
     * after scoring everyone, not once per student.
     *
     * @param string $examId
     * @param string $studentId
     * @return array
     */
    public function evaluateStudent(string $examId, string $studentId): array
    {
        return $this->executeWithFallback(
            function () use ($examId, $studentId) {
                $response = $this->studentResponseRepository->findByStudentAndExam($examId, $studentId);
                if (!$response) {
                    throw new ServiceException("No response sheet uploaded for this student", 'ScoringService', false);
                }

                $answerKey = $this->answerKeyRepository->findByExam($examId);
                if (!$answerKey || empty($answerKey['entries'])) {
                    throw new ServiceException("No answer key available for this exam", 'ScoringService', false);
                }

                $exam = $this->examRepository->getById($examId);
                if (!$exam) {
                    throw new ServiceException("Exam not found: {$examId}", 'ScoringService', false);
                }

                $alreadyEvaluated = $response['processing'] === 'evaluated';

                [$scoredRows, $summary] = $this->scoreRows($response['rows'], $answerKey['entries']);

                $this->studentResponseRepository->updateRows($response['id'], $scoredRows);
                $this->studentResponseRepository->updateStatus($response['id'], 'evaluated', 'valid');

                $existing = $this->resultRepository->getStudentExamResult($studentId, $examId);
                $resultPayload = [
                    'studentId' => $studentId,
                    'examId' => $examId,
                    'examName' => $exam['name'],
                    'courseSlug' => $exam['courseSlug'],
                    'score' => $summary['score'],
                    'maxScore' => $summary['maxScore'],
                    'percentage' => $summary['maxScore'] > 0
                        ? round(($summary['score'] / $summary['maxScore']) * 100, 2)
                        : 0,
                    'accuracy' => $summary['attempted'] > 0
                        ? round(($summary['correct'] / $summary['attempted']) * 100, 2)
                        : 0,
                    'correct' => $summary['correct'],
                    'incorrect' => $summary['incorrect'],
                    'unattempted' => $summary['unattempted'],
                    'timeTakenMin' => $summary['timeTakenMin'],
                    'status' => 'processing',
                    'date' => date('Y-m-d H:i:s'),
                ];

                if ($existing) {
                    $this->resultRepository->update($existing['id'], $resultPayload);
                    $result = $this->resultRepository->getById($existing['id']);
                } else {
                    $result = $this->resultRepository->create($resultPayload);
                }

                if (!$alreadyEvaluated) {
                    $this->rollUpTopicPerformance($studentId, $exam['courseSlug'], $summary['byTopic']);
                }

                $this->regenerateAnalysis($studentId, $exam['courseSlug']);

                $this->auditLog('EVALUATE', 'StudentResponse', $response['id'], [
                    'studentId' => $studentId,
                    'examId' => $examId,
                    'score' => $summary['score'],
                ]);

                return ['success' => true, 'data' => $result, 'message' => 'Response evaluated successfully'];
            },
            null,
            'evaluateStudent'
        );
    }

    /**
     * Evaluate every uploaded, not-yet-evaluated response for an exam,
     * then rebuild the exam's leaderboard once at the end.
     *
     * @param string $examId
     * @return array
     */
    public function evaluateExam(string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($examId) {
                $responses = $this->studentResponseRepository->getByExam($examId);

                $evaluated = 0;
                $failed = [];

                foreach ($responses as $response) {
                    $outcome = $this->evaluateStudent($examId, $response['studentId']);
                    if ($outcome['success']) {
                        $evaluated++;
                    } else {
                        $failed[] = $response['studentId'];
                    }
                }

                $leaderboard = $this->regenerateLeaderboard($examId);

                $this->auditLog('EVALUATE_EXAM', 'Exam', $examId, [
                    'evaluated' => $evaluated,
                    'failed' => count($failed),
                ]);

                return [
                    'success' => true,
                    'data' => [
                        'evaluated' => $evaluated,
                        'failed' => $failed,
                        'leaderboardSize' => count($leaderboard['data'] ?? []),
                    ],
                    'message' => "Evaluated {$evaluated} response(s), rebuilt leaderboard",
                ];
            },
            null,
            'evaluateExam'
        );
    }

    /**
     * Recompute rank/percentile for every Result in an exam and replace
     * the exam's Leaderboard snapshot. Safe to call standalone (e.g. an
     * admin manually re-publishing after a correction) as well as from
     * evaluateExam().
     *
     * @param string $examId
     * @return array
     */
    public function regenerateLeaderboard(string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($examId) {
                $results = $this->resultRepository->getByExamOrderedByScore($examId);
                $total = count($results);

                $rows = [];
                foreach ($results as $index => $result) {
                    $rank = $index + 1;
                    $percentile = $total > 0 ? round((($total - $rank) / $total) * 100, 2) : 0;

                    $this->resultRepository->updateRanking($result['id'], $rank, $percentile, $total);

                    $student = $this->studentRepository->getById($result['studentId']);

                    $rows[] = [
                        'studentId' => $result['studentId'],
                        'studentName' => $student['fullName'] ?? null,
                        'className' => $student['className'] ?? null,
                        'courseSlug' => $result['courseSlug'] ?? null,
                        'rank' => $rank,
                        'score' => $result['score'],
                        'percentage' => $result['percentage'],
                        'period' => 'exam',
                    ];
                }

                $this->leaderboardRepository->replaceForExam($examId, $rows);

                return ['success' => true, 'data' => $rows, 'message' => 'Leaderboard rebuilt'];
            },
            ['success' => false, 'error' => 'Unable to rebuild leaderboard'],
            'regenerateLeaderboard'
        );
    }

    /**
     * Score each response row against the answer key.
     *
     * @param array $rows Uploaded rows: {qNo, markedOption, timeSpentSec, ...}
     * @param array $entries Answer key entries: {qNo, subject, topic, correctOption, marks, negative}
     * @return array{0: array, 1: array} [scoredRows, summary]
     */
    private function scoreRows(array $rows, array $entries): array
    {
        $keyByQNo = [];
        foreach ($entries as $entry) {
            $keyByQNo[$entry['qNo']] = $entry;
        }

        $scoredRows = [];
        $score = 0.0;
        $maxScore = 0.0;
        $correct = 0;
        $incorrect = 0;
        $unattempted = 0;
        $timeSpentSec = 0;
        $byTopic = [];

        foreach ($keyByQNo as $qNo => $entry) {
            $marks = (float) ($entry['marks'] ?? 4);
            $negative = (float) ($entry['negative'] ?? 1);
            $maxScore += $marks;

            $row = null;
            foreach ($rows as $r) {
                if (($r['qNo'] ?? null) === $qNo) {
                    $row = $r;
                    break;
                }
            }

            $markedOption = $row['markedOption'] ?? null;
            $timeSpentSec += (int) ($row['timeSpentSec'] ?? 0);

            if ($markedOption === null || $markedOption === '') {
                $status = 'unattempted';
                $rowMarks = 0.0;
                $unattempted++;
            } elseif ($markedOption === $entry['correctOption']) {
                $status = 'correct';
                $rowMarks = $marks;
                $correct++;
            } else {
                $status = 'incorrect';
                $rowMarks = -$negative;
                $incorrect++;
            }

            $score += $rowMarks;

            $topicKey = ($entry['subject'] ?? 'General') . '::' . ($entry['topic'] ?? 'General');
            if (!isset($byTopic[$topicKey])) {
                $byTopic[$topicKey] = [
                    'subject' => $entry['subject'] ?? 'General',
                    'topic' => $entry['topic'] ?? 'General',
                    'attempted' => 0,
                    'correct' => 0,
                ];
            }
            if ($status !== 'unattempted') {
                $byTopic[$topicKey]['attempted']++;
            }
            if ($status === 'correct') {
                $byTopic[$topicKey]['correct']++;
            }

            $scoredRows[] = [
                'qNo' => $qNo,
                'subject' => $entry['subject'] ?? null,
                'topic' => $entry['topic'] ?? null,
                'markedOption' => $markedOption,
                'correctOption' => $entry['correctOption'],
                'status' => $status,
                'timeSpentSec' => (int) ($row['timeSpentSec'] ?? 0),
                'marks' => $rowMarks,
            ];
        }

        return [$scoredRows, [
            'score' => round($score, 2),
            'maxScore' => round($maxScore, 2),
            'correct' => $correct,
            'incorrect' => $incorrect,
            'unattempted' => $unattempted,
            'attempted' => $correct + $incorrect,
            'timeTakenMin' => (int) round($timeSpentSec / 60),
            'byTopic' => $byTopic,
        ]];
    }

    /**
     * @param string $studentId
     * @param string $courseSlug
     * @param array $byTopic Keyed by "subject::topic" => {subject, topic, attempted, correct}
     * @return void
     */
    private function rollUpTopicPerformance(string $studentId, string $courseSlug, array $byTopic): void
    {
        foreach ($byTopic as $entry) {
            $this->topicPerformanceRepository->recordAttempt(
                $studentId,
                $courseSlug,
                $entry['subject'],
                $entry['topic'],
                $entry['correct'],
                $entry['attempted']
            );
        }
    }

    /**
     * Recompute the cached PerformanceAnalysis for a student within a
     * course from their full result history and current topic rollups.
     *
     * @param string $studentId
     * @param string $courseSlug
     * @return void
     */
    private function regenerateAnalysis(string $studentId, string $courseSlug): void
    {
        $results = array_values(array_filter(
            $this->resultRepository->getByStudent($studentId),
            fn($r) => $r['courseSlug'] === $courseSlug
        ));

        $scoreTrend = array_map(fn($r) => [
            'exam' => $r['examName'],
            'score' => (float) $r['score'],
            'average' => (float) ($r['averageScore'] ?? 0),
            'topper' => (float) ($r['topPerformerScore'] ?? 0),
        ], $results);

        $rankTrend = array_map(fn($r) => [
            'exam' => $r['examName'],
            'rank' => (int) ($r['rank'] ?? 0),
            'percentile' => (float) ($r['percentile'] ?? 0),
        ], $results);

        $accuracyTrend = array_map(fn($r) => [
            'exam' => $r['examName'],
            'accuracy' => (float) ($r['accuracy'] ?? 0),
        ], $results);

        $improvementPercent = 0.0;
        if (count($accuracyTrend) >= 2) {
            $last = end($accuracyTrend);
            $prev = $accuracyTrend[count($accuracyTrend) - 2];
            $improvementPercent = round($last['accuracy'] - $prev['accuracy'], 2);
        }

        $strengths = $this->topicPerformanceRepository->getStrongTopics($studentId, $courseSlug, 5);
        $weaknesses = $this->topicPerformanceRepository->getWeakTopics($studentId, $courseSlug, 5);

        $latestResult = end($results) ?: null;

        $this->resultAnalysisRepository->upsert($studentId, $courseSlug, [
            'scoreTrend' => $scoreTrend,
            'rankTrend' => $rankTrend,
            'accuracyTrend' => $accuracyTrend,
            'subjectComparison' => [], // requires per-subject breakdown not persisted on results; left for a future subject_results table
            'strengths' => array_map(fn($t) => "{$t['subject']}: {$t['topic']}", $strengths),
            'weaknesses' => array_map(fn($t) => "{$t['subject']}: {$t['topic']}", $weaknesses),
            'improvements' => array_map(fn($t) => "Practice more {$t['topic']} questions ({$t['subject']})", $weaknesses),
            'timeDistribution' => [],
            'summary' => $latestResult
                ? "Latest exam: {$latestResult['examName']}, scored {$latestResult['score']}/{$latestResult['maxScore']} ({$latestResult['percentage']}%)"
                : 'No results yet',
            'improvementPercent' => $improvementPercent,
        ]);
    }
}
