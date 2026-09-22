<?php

namespace Nirvona\Services;

use Nirvona\Repositories\ExamCandidateRepository;
use Nirvona\Repositories\ExamRepository;
use Nirvona\Repositories\EnrollmentRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * ExamCandidateService
 *
 * Handles exam attendance & seat allocation with error isolation.
 */
class ExamCandidateService extends BaseService
{
    private ExamCandidateRepository $examCandidateRepository;
    private ExamRepository $examRepository;
    private EnrollmentRepository $enrollmentRepository;

    public function __construct(
        ExamCandidateRepository $examCandidateRepository,
        ExamRepository $examRepository,
        EnrollmentRepository $enrollmentRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->examCandidateRepository = $examCandidateRepository;
        $this->examRepository = $examRepository;
        $this->enrollmentRepository = $enrollmentRepository;
    }

    /**
     * List candidates registered for an exam
     *
     * @param string $examId
     * @return array
     */
    public function getByExam(string $examId): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->examCandidateRepository->getRosterByExam($examId)],
            ['success' => true, 'data' => []],
            'getCandidatesByExam'
        );
    }

    /**
     * Register a student as a candidate for an exam
     *
     * @param array $data studentId, examId, studentName, seatNo
     * @return array
     */
    public function register(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $errors = $this->validate($data, [
                    'studentId' => ['required'],
                    'examId' => ['required'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'ExamCandidateService',
                        false
                    );
                }

                if ($this->examCandidateRepository->findByStudentAndExam($data['studentId'], $data['examId'])) {
                    throw new ServiceException(
                        "Student is already registered for this exam",
                        'ExamCandidateService',
                        false
                    );
                }

                $candidate = $this->examCandidateRepository->create($data);
                $this->examRepository->syncCandidateCount($data['examId']);

                $this->auditLog('REGISTER', 'ExamCandidate', $candidate['id'], [
                    'studentId' => $data['studentId'],
                    'examId' => $data['examId'],
                ]);

                return ['success' => true, 'data' => $candidate, 'message' => 'Candidate registered successfully'];
            },
            null,
            'registerCandidate'
        );
    }

    /**
     * Register every actively-enrolled student of the exam's course who
     * isn't already a candidate. This is the normal way a roster gets
     * built - nothing else in the app adds a student to an exam, so
     * without it "generate admit cards" / "assign credentials" always
     * finds zero candidates for a freshly created exam.
     *
     * @param string $examId
     * @return array
     */
    public function registerEnrolled(string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($examId) {
                $exam = $this->examRepository->getById($examId);
                if (!$exam) {
                    throw new ServiceException("Exam not found: {$examId}", 'ExamCandidateService', false);
                }

                $studentIds = $this->enrollmentRepository->getActiveStudentIdsForCourse($exam['courseSlug']);
                $already = array_column($this->examCandidateRepository->getByExam($examId), 'studentId');
                $toAdd = array_diff($studentIds, $already);

                foreach ($toAdd as $studentId) {
                    $this->examCandidateRepository->create(['studentId' => $studentId, 'examId' => $examId]);
                }

                if (!empty($toAdd)) {
                    $this->examRepository->syncCandidateCount($examId);
                }

                $this->auditLog('REGISTER_ENROLLED', 'Exam', $examId, ['count' => count($toAdd)]);

                return [
                    'success' => true,
                    'data' => ['registered' => count($toAdd), 'alreadyRegistered' => count($already)],
                    'message' => count($toAdd) > 0
                        ? count($toAdd) . ' candidate(s) registered'
                        : 'Every actively-enrolled student for this course is already a candidate',
                ];
            },
            null,
            'registerEnrolledCandidates'
        );
    }

    /**
     * Record a candidate's attendance
     *
     * @param string $candidateId
     * @param string $attendance "present" | "absent" | "pending"
     * @return array
     */
    public function markAttendance(string $candidateId, string $attendance): array
    {
        return $this->executeWithFallback(
            function () use ($candidateId, $attendance) {
                if (!in_array($attendance, ['present', 'absent', 'pending'], true)) {
                    throw new ServiceException("Invalid attendance value", 'ExamCandidateService', false);
                }

                $this->examCandidateRepository->markAttendance($candidateId, $attendance);

                $this->auditLog('MARK_ATTENDANCE', 'ExamCandidate', $candidateId, ['attendance' => $attendance]);

                return ['success' => true, 'message' => 'Attendance recorded'];
            },
            null,
            'markAttendance'
        );
    }

    /**
     * Get attendance summary for an exam
     *
     * @param string $examId
     * @return array
     */
    public function getAttendanceSummary(string $examId): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->examCandidateRepository->getAttendanceSummary($examId)],
            ['success' => false, 'error' => 'Unable to fetch attendance summary'],
            'getAttendanceSummary'
        );
    }
}
