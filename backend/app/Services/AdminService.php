<?php

namespace Nirvona\Services;

use Nirvona\Repositories\StudentRepository;
use Nirvona\Repositories\PaymentRepository;
use Nirvona\Repositories\ExamRepository;
use Nirvona\Repositories\ResultRepository;
use Nirvona\Repositories\EnrollmentRepository;
use Nirvona\Repositories\ExamCandidateRepository;
use Nirvona\Repositories\ActivityRepository;
use Nirvona\Repositories\AdmitCardRepository;
use Nirvona\Repositories\ExamCredentialRepository;
use Nirvona\Repositories\ExamCentreRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * AdminService
 *
 * Aggregates data across several repositories for the admin dashboard.
 * Extends BaseService so a failure in any one source (e.g. the
 * enrollments count) degrades that one figure instead of crashing the
 * whole dashboard.
 */
class AdminService extends BaseService
{
    private StudentRepository $studentRepository;
    private PaymentRepository $paymentRepository;
    private ExamRepository $examRepository;
    private ResultRepository $resultRepository;
    private EnrollmentRepository $enrollmentRepository;
    private ExamCandidateRepository $examCandidateRepository;
    private ActivityRepository $activityRepository;
    private AdmitCardRepository $admitCardRepository;
    private ExamCredentialRepository $examCredentialRepository;
    private ExamCentreRepository $examCentreRepository;

    public function __construct(
        StudentRepository $studentRepository,
        PaymentRepository $paymentRepository,
        ExamRepository $examRepository,
        ResultRepository $resultRepository,
        EnrollmentRepository $enrollmentRepository,
        ExamCandidateRepository $examCandidateRepository,
        ActivityRepository $activityRepository,
        AdmitCardRepository $admitCardRepository,
        ExamCredentialRepository $examCredentialRepository,
        ExamCentreRepository $examCentreRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->studentRepository = $studentRepository;
        $this->paymentRepository = $paymentRepository;
        $this->examRepository = $examRepository;
        $this->resultRepository = $resultRepository;
        $this->enrollmentRepository = $enrollmentRepository;
        $this->examCandidateRepository = $examCandidateRepository;
        $this->activityRepository = $activityRepository;
        $this->admitCardRepository = $admitCardRepository;
        $this->examCredentialRepository = $examCredentialRepository;
        $this->examCentreRepository = $examCentreRepository;
    }

    /**
     * Get top-line dashboard stats
     *
     * @return array
     */
    public function getDashboardStats(): array
    {
        return $this->executeWithFallback(
            function () {
                $paymentStats = $this->paymentRepository->getStats();

                return [
                    'success' => true,
                    'data' => [
                        'totalStudents' => $this->studentRepository->countActive(),
                        'activeEnrollments' => $this->enrollmentRepository->countActive(),
                        'successfulPurchases' => (int) ($paymentStats['successful'] ?? 0),
                        'revenue' => (float) ($paymentStats['totalRevenue'] ?? 0),
                        'upcomingExams' => count($this->examRepository->getUpcoming()),
                        'pendingResults' => $this->resultRepository->countByStatus('processing'),
                        // Month-over-month % change per stat. The frontend's
                        // AdminStats type requires this (dashboard.tsx reads
                        // data.deltas.<key> unconditionally and crashes on
                        // undefined) - real trend computation needs a
                        // period-over-period query per stat, which isn't
                        // built yet, so this reports 0 rather than fabricating
                        // a number until that exists.
                        'deltas' => [
                            'totalStudents' => 0,
                            'activeEnrollments' => 0,
                            'successfulPurchases' => 0,
                            'revenue' => 0,
                            'upcomingExams' => 0,
                            'pendingResults' => 0,
                        ],
                    ],
                ];
            },
            ['success' => false, 'error' => 'Unable to load dashboard stats'],
            'getDashboardStats'
        );
    }

    /**
     * List students, paginated
     *
     * @param int $page
     * @param int $pageSize
     * @return array
     */
    public function listStudents(int $page = 1, int $pageSize = 20): array
    {
        return $this->executeWithFallback(
            function () use ($page, $pageSize) {
                $offset = ($page - 1) * $pageSize;
                return [
                    'success' => true,
                    'data' => $this->studentRepository->getAll($pageSize, $offset),
                    'meta' => [
                        'total' => $this->studentRepository->count(),
                        'page' => $page,
                        'pageSize' => $pageSize,
                    ],
                ];
            },
            ['success' => true, 'data' => [], 'meta' => ['total' => 0, 'page' => $page, 'pageSize' => $pageSize]],
            'listStudents'
        );
    }

    /**
     * List payments, paginated
     *
     * @param int $page
     * @param int $pageSize
     * @return array
     */
    public function listPayments(int $page = 1, int $pageSize = 20): array
    {
        return $this->executeWithFallback(
            function () use ($page, $pageSize) {
                $offset = ($page - 1) * $pageSize;
                return [
                    'success' => true,
                    'data' => $this->paymentRepository->getAll($pageSize, $offset),
                    'meta' => [
                        'total' => $this->paymentRepository->count(),
                        'page' => $page,
                        'pageSize' => $pageSize,
                    ],
                ];
            },
            ['success' => true, 'data' => [], 'meta' => ['total' => 0, 'page' => $page, 'pageSize' => $pageSize]],
            'listPayments'
        );
    }

    /**
     * List exams, paginated
     *
     * @param int $page
     * @param int $pageSize
     * @return array
     */
    public function listExams(int $page = 1, int $pageSize = 20): array
    {
        return $this->executeWithFallback(
            function () use ($page, $pageSize) {
                $offset = ($page - 1) * $pageSize;
                return [
                    'success' => true,
                    'data' => $this->examRepository->getAll($pageSize, $offset),
                    'meta' => [
                        'total' => $this->examRepository->count(),
                        'page' => $page,
                        'pageSize' => $pageSize,
                    ],
                ];
            },
            ['success' => true, 'data' => [], 'meta' => ['total' => 0, 'page' => $page, 'pageSize' => $pageSize]],
            'listExams'
        );
    }

    /**
     * Monthly revenue + purchase count for the last N months. Previously
     * a hard-coded frontend constant (REVENUE_TREND) - this replaces it
     * with a real query, zero-filling any month with no successful
     * payments so the chart still shows a continuous run of months.
     *
     * @param int $months
     * @return array
     */
    public function getRevenueTrend(int $months = 6): array
    {
        return $this->executeWithFallback(
            function () use ($months) {
                $rows = $this->paymentRepository->getMonthlyRevenue($months);
                $byMonth = [];
                foreach ($rows as $row) {
                    $byMonth[$row['ym']] = $row;
                }

                $data = [];
                foreach ($this->lastNMonths($months) as $ym => $label) {
                    $data[] = [
                        'month' => $label,
                        'revenue' => (float) ($byMonth[$ym]['revenue'] ?? 0),
                        'purchases' => (int) ($byMonth[$ym]['purchases'] ?? 0),
                    ];
                }

                return ['success' => true, 'data' => $data];
            },
            ['success' => true, 'data' => []],
            'getRevenueTrend'
        );
    }

    /**
     * Monthly new registrations vs. new (paid) enrollments for the last
     * N months. Previously a hard-coded frontend constant
     * (REGISTRATION_TREND).
     *
     * @param int $months
     * @return array
     */
    public function getRegistrationTrend(int $months = 6): array
    {
        return $this->executeWithFallback(
            function () use ($months) {
                $registrations = [];
                foreach ($this->studentRepository->getMonthlyRegistrations($months) as $row) {
                    $registrations[$row['ym']] = (int) $row['registrations'];
                }

                $activations = [];
                foreach ($this->enrollmentRepository->getMonthlyActivations($months) as $row) {
                    $activations[$row['ym']] = (int) $row['activations'];
                }

                $data = [];
                foreach ($this->lastNMonths($months) as $ym => $label) {
                    $data[] = [
                        'month' => $label,
                        'registrations' => $registrations[$ym] ?? 0,
                        'active' => $activations[$ym] ?? 0,
                    ];
                }

                return ['success' => true, 'data' => $data];
            },
            ['success' => true, 'data' => []],
            'getRegistrationTrend'
        );
    }

    /**
     * Registered vs. appeared vs. absent for the most recent exams.
     * Previously a hard-coded frontend constant (PARTICIPATION_TREND).
     *
     * @param int $limit
     * @return array
     */
    public function getParticipationTrend(int $limit = 6): array
    {
        return $this->executeWithFallback(
            function () use ($limit) {
                $rows = array_reverse($this->examCandidateRepository->getParticipationByExam($limit));
                $data = array_map(fn($row) => [
                    'exam' => $row['examName'],
                    'registered' => (int) $row['registered'],
                    'appeared' => (int) $row['appeared'],
                    'absent' => (int) $row['absent'],
                ], $rows);

                return ['success' => true, 'data' => $data];
            },
            ['success' => true, 'data' => []],
            'getParticipationTrend'
        );
    }

    /**
     * Active-student distribution across courses/programs. Previously a
     * hard-coded frontend constant (COURSE_SPLIT) - colors are assigned
     * client-side now since this is presentation, not domain data.
     *
     * @return array
     */
    public function getCourseSplit(): array
    {
        return $this->executeWithFallback(
            function () {
                $rows = $this->enrollmentRepository->getActiveDistributionByCourse();
                $data = array_map(fn($row) => [
                    'course' => $row['courseName'],
                    'students' => (int) $row['students'],
                ], $rows);

                return ['success' => true, 'data' => $data];
            },
            ['success' => true, 'data' => []],
            'getCourseSplit'
        );
    }

    /**
     * Recent activity feed. Previously called an endpoint
     * (/api/admin/activity) that didn't exist anywhere in the backend -
     * every request 404'd.
     *
     * @param int $limit
     * @return array
     */
    public function getActivity(int $limit = 20): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->activityRepository->getRecent($limit)],
            ['success' => true, 'data' => []],
            'getActivity'
        );
    }

    /**
     * Mark a successful payment as refunded
     *
     * This only updates the payment record's own status - it does not
     * touch the student's enrollment/access, which is a separate manual
     * step (revoking access on refund is a real product decision that
     * shouldn't happen silently as a side effect of a status change).
     * Actually issuing the refund through PhonePe happens outside this
     * app; this records that it happened.
     *
     * @param string $id
     * @return array
     */
    public function refundPayment(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                $payment = $this->paymentRepository->getById($id);
                if (!$payment) {
                    throw new ServiceException("Payment not found: {$id}", 'AdminService', false);
                }

                if ($payment['status'] !== 'successful') {
                    throw new ServiceException(
                        "Only a successful payment can be refunded (current status: {$payment['status']})",
                        'AdminService',
                        false
                    );
                }

                $this->paymentRepository->update($id, ['status' => 'refunded']);
                $this->auditLog('REFUND', 'Payment', $id, ['amount' => $payment['total']]);

                return [
                    'success' => true,
                    'data' => $this->paymentRepository->getById($id),
                    'message' => 'Payment marked as refunded',
                ];
            },
            null,
            'refundPayment'
        );
    }

    /**
     * Update a student's profile (admin-side)
     *
     * @param string $id
     * @param array $data
     * @return array
     */
    public function updateStudent(string $id, array $data): array
    {
        return $this->executeWithFallback(
            function () use ($id, $data) {
                if (!$this->studentRepository->getById($id)) {
                    throw new ServiceException("Student not found: {$id}", 'AdminService', false);
                }

                // Password changes go through a dedicated reset flow
                // (hashing, current-password checks) - never accept a raw
                // passwordHash/password field from a generic profile-edit
                // payload, admin or not.
                unset($data['passwordHash'], $data['password']);

                $this->studentRepository->update($id, $data);
                $this->auditLog('UPDATE', 'Student', $id, ['fields' => array_keys($data)]);

                return [
                    'success' => true,
                    'data' => $this->studentRepository->getById($id),
                    'message' => 'Student updated successfully',
                ];
            },
            null,
            'updateStudent'
        );
    }

    /**
     * Deactivate a student (soft delete)
     *
     * Not a hard DELETE: payments.studentId and results.studentId have no
     * ON DELETE clause (defaults to RESTRICT), so any student with a
     * single payment or result - i.e. almost every real, paying student -
     * would throw a raw foreign key violation. Meanwhile enrollments/
     * exam_candidates/student_responses ARE ON DELETE CASCADE, so a hard
     * delete would silently wipe those for anyone it didn't outright fail
     * on. Deactivating preserves every record and simply removes the
     * student from active rosters/leaderboards (which already filter on
     * status = 'active').
     *
     * @param string $id
     * @return array
     */
    public function deactivateStudent(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                if (!$this->studentRepository->getById($id)) {
                    throw new ServiceException("Student not found: {$id}", 'AdminService', false);
                }

                $this->studentRepository->update($id, ['status' => 'inactive']);
                // Cut off any session they already have, right now.
                \Nirvona\Support\TokenRevocation::revoke($id);
                $this->auditLog('DEACTIVATE', 'Student', $id, []);

                return ['success' => true, 'message' => 'Student deactivated successfully'];
            },
            null,
            'deactivateStudent'
        );
    }

    /**
     * Reactivate a previously deactivated student
     *
     * @param string $id
     * @return array
     */
    public function reactivateStudent(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                if (!$this->studentRepository->getById($id)) {
                    throw new ServiceException("Student not found: {$id}", 'AdminService', false);
                }

                $this->studentRepository->update($id, ['status' => 'active']);
                \Nirvona\Support\TokenRevocation::restore($id);
                $this->auditLog('REACTIVATE', 'Student', $id, []);

                return ['success' => true, 'message' => 'Student reactivated successfully'];
            },
            null,
            'reactivateStudent'
        );
    }

    /**
     * List the available operational reports with real record counts.
     *
     * Was routed straight at getDashboardStats() (a completely different
     * response shape - an object of top-line figures, not an array of
     * report definitions) as a placeholder until this existed. The
     * frontend's ReportsCentre calls `.map()` on the response expecting
     * an array, so that placeholder crashed the whole page white
     * whenever anyone opened /admin/reports.
     *
     * Report *definitions* (id/name/description/category) mirror the
     * static catalog every report's export column mapping already keys
     * off (see reports-centre.tsx's COLUMN_MAP) - only `records` and
     * `updated` are live. The actual downloadable CSV content for each
     * report is a separate, larger piece of work (per-report data
     * endpoints) not covered here.
     *
     * @return array
     */
    public function getReports(): array
    {
        return $this->executeWithFallback(
            function () {
                $today = date('Y-m-d');
                $reports = [
                    [
                        'id' => 'RPT-01', 'name' => 'Student Master Report',
                        'description' => 'Every registered student with contact, class, course and enrolment status.',
                        'category' => 'People', 'records' => $this->studentRepository->count(), 'updated' => $today,
                    ],
                    [
                        'id' => 'RPT-02', 'name' => 'Purchase Report',
                        'description' => 'All purchase attempts with package, amount and payment gateway reference.',
                        'category' => 'Finance', 'records' => $this->paymentRepository->count(), 'updated' => $today,
                    ],
                    [
                        'id' => 'RPT-03', 'name' => 'Payment Report',
                        'description' => 'Settled, pending, failed and refunded transactions with reconciliation status.',
                        'category' => 'Finance', 'records' => $this->paymentRepository->count(), 'updated' => $today,
                    ],
                    [
                        'id' => 'RPT-04', 'name' => 'Exam Participation Report',
                        'description' => 'Registered vs appeared vs absent candidates, per exam and per centre.',
                        'category' => 'Examinations', 'records' => $this->examCandidateRepository->count(), 'updated' => $today,
                    ],
                    [
                        'id' => 'RPT-05', 'name' => 'Admit Card Report',
                        'description' => 'Generation, publication and delivery status of every admit card.',
                        'category' => 'Examinations', 'records' => $this->admitCardRepository->count(), 'updated' => $today,
                    ],
                    [
                        'id' => 'RPT-06', 'name' => 'Credential Report',
                        'description' => 'Exam-hall credential assignment status with validation exceptions.',
                        'category' => 'Examinations', 'records' => $this->examCredentialRepository->count(), 'updated' => $today,
                    ],
                    [
                        'id' => 'RPT-07', 'name' => 'Result Report',
                        'description' => 'Scores, ranks, percentiles and subject-wise breakdown per candidate.',
                        'category' => 'Evaluation', 'records' => $this->resultRepository->count(), 'updated' => $today,
                    ],
                    [
                        'id' => 'RPT-08', 'name' => 'Centre Performance Report',
                        'description' => 'Average score, attendance and infrastructure utilisation per centre.',
                        'category' => 'Examinations', 'records' => $this->examCentreRepository->count(), 'updated' => $today,
                    ],
                ];
                return ['success' => true, 'data' => $reports];
            },
            ['success' => true, 'data' => []],
            'getReports'
        );
    }

    /**
     * Build an ordered ["YYYY-MM" => "Mon"] map for the last N months
     * (oldest first), e.g. months=3 as of September gives
     * ["2026-07"=>"Jul", "2026-08"=>"Aug", "2026-09"=>"Sep"]. Used to
     * zero-fill trend charts so every month appears even with no data.
     *
     * @param int $months
     * @return array<string, string>
     */
    private function lastNMonths(int $months): array
    {
        $result = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $timestamp = strtotime("-{$i} months");
            $result[date('Y-m', $timestamp)] = date('M', $timestamp);
        }
        return $result;
    }
}
