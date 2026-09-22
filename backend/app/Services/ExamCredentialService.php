<?php

namespace Nirvona\Services;

use Nirvona\Repositories\ExamCredentialRepository;
use Nirvona\Repositories\ExamCandidateRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * ExamCredentialService
 *
 * Handles exam-hall CBT login credential issuance with error
 * isolation. Never returns a password hash to a caller.
 */
class ExamCredentialService extends BaseService
{
    private ExamCredentialRepository $examCredentialRepository;
    private ExamCandidateRepository $examCandidateRepository;

    public function __construct(
        ExamCredentialRepository $examCredentialRepository,
        ExamCandidateRepository $examCandidateRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->examCredentialRepository = $examCredentialRepository;
        $this->examCandidateRepository = $examCandidateRepository;
    }

    /**
     * List credentials issued for an exam
     *
     * @param string $examId
     * @return array
     */
    public function getByExam(string $examId): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->examCredentialRepository->getByExam($examId)],
            ['success' => true, 'data' => []],
            'getCredentialsByExam'
        );
    }

    /**
     * Get a student's credential for an exam
     *
     * @param string $studentId
     * @param string $examId
     * @return array
     */
    public function getForStudent(string $studentId, string $examId): array
    {
        return $this->executeWithFallback(
            function () use ($studentId, $examId) {
                $credential = $this->examCredentialRepository->findByStudentAndExam($studentId, $examId);

                if (!$credential) {
                    throw new ServiceException("Credential not found", 'ExamCredentialService', false);
                }

                return ['success' => true, 'data' => $credential];
            },
            ['success' => false, 'error' => 'Unable to fetch exam credential'],
            'getCredentialForStudent'
        );
    }

    /**
     * Generate and assign a login credential to a student for an exam
     *
     * @param array $data studentId, examId, studentName
     * @return array
     */
    public function assign(array $data): array
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
                        'ExamCredentialService',
                        false
                    );
                }

                // UNIQUE(studentId, examId) means a revoked credential still
                // occupies the row - only a genuinely still-active one should
                // block a new assignment. A revoked one gets reissued below
                // instead of inserted as a second row (which the constraint
                // would reject anyway).
                $existing = $this->examCredentialRepository->findByStudentAndExam($data['studentId'], $data['examId']);
                if ($existing && $existing['status'] !== 'revoked') {
                    throw new ServiceException(
                        "Credential already assigned for this student/exam",
                        'ExamCredentialService',
                        false
                    );
                }

                $loginId = $data['loginId'] ?? ('CBT' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6)));
                $plainPassword = $data['password'] ?? bin2hex(random_bytes(4));

                if ($existing) {
                    $this->examCredentialRepository->update($existing['id'], [
                        'loginId' => $loginId,
                        'passwordHash' => password_hash($plainPassword, PASSWORD_DEFAULT),
                        'status' => 'assigned',
                        'assignedAt' => date('Y-m-d H:i:s'),
                    ]);
                    $credential = $this->examCredentialRepository->getById($existing['id']);
                } else {
                    $credential = $this->examCredentialRepository->createWithPassword([
                        'studentId' => $data['studentId'],
                        'examId' => $data['examId'],
                        'studentName' => $data['studentName'] ?? null,
                        'loginId' => $loginId,
                        'status' => 'assigned',
                        'assignedAt' => date('Y-m-d H:i:s'),
                    ], $plainPassword);
                }

                $this->auditLog('ASSIGN', 'ExamCredential', $credential['id'], [
                    'studentId' => $data['studentId'],
                    'examId' => $data['examId'],
                ]);

                // The one-time plaintext password is returned here only so it can be
                // communicated to the student out-of-band - it is never stored or
                // retrievable again after this response.
                return [
                    'success' => true,
                    'data' => $credential + ['password' => $plainPassword],
                    'message' => 'Credential assigned successfully',
                ];
            },
            null,
            'assignCredential'
        );
    }

    /**
     * Bulk-assign credentials from an uploaded roster (the "upload a
     * workbook, validate, map" admin workflow). Each row is run through
     * the exact same assign() above - so a row that is already assigned
     * comes back "duplicate" for the same reason a single assign() call
     * would fail, not a second, drifting copy of that rule.
     *
     * @param string $examId
     * @param array<int, array{row?: int, studentId?: string, studentName?: string, loginId?: string, password?: string}> $rows
     * @return array
     */
    public function bulkAssign(string $examId, array $rows): array
    {
        return $this->executeWithFallback(
            function () use ($examId, $rows) {
                $candidateIds = array_column($this->examCandidateRepository->getByExam($examId), 'studentId');
                $candidateSet = array_flip($candidateIds);

                $successful = 0;
                $duplicate = 0;
                $invalid = 0;
                $missingStudentId = 0;
                $problems = [];
                $seenLoginIds = [];

                foreach ($rows as $i => $row) {
                    $rowNumber = $row['row'] ?? ($i + 2); // +2: header row + 1-indexed
                    $studentId = trim((string) ($row['studentId'] ?? ''));
                    $loginId = trim((string) ($row['loginId'] ?? ''));
                    $password = (string) ($row['password'] ?? '');

                    if ($studentId === '') {
                        $missingStudentId++;
                        $problems[] = [
                            'row' => $rowNumber, 'studentId' => '', 'studentName' => $row['studentName'] ?? '—',
                            'loginId' => $loginId, 'status' => 'invalid', 'message' => 'Student ID column is empty',
                        ];
                        continue;
                    }

                    if (!isset($candidateSet[$studentId])) {
                        $invalid++;
                        $problems[] = [
                            'row' => $rowNumber, 'studentId' => $studentId, 'studentName' => $row['studentName'] ?? '—',
                            'loginId' => $loginId, 'status' => 'invalid',
                            'message' => 'Student ID not found in this exam\'s candidate list',
                        ];
                        continue;
                    }

                    if ($loginId === '' || $password === '') {
                        $invalid++;
                        $problems[] = [
                            'row' => $rowNumber, 'studentId' => $studentId, 'studentName' => $row['studentName'] ?? '—',
                            'loginId' => $loginId, 'status' => 'invalid',
                            'message' => $loginId === '' ? 'Exam Login ID column is empty' : 'Exam Password column is empty',
                        ];
                        continue;
                    }

                    if (strlen($password) < 8 || strlen($password) > 16) {
                        $invalid++;
                        $problems[] = [
                            'row' => $rowNumber, 'studentId' => $studentId, 'studentName' => $row['studentName'] ?? '—',
                            'loginId' => $loginId, 'status' => 'invalid',
                            'message' => 'Password must be 8-16 characters',
                        ];
                        continue;
                    }

                    $loginKey = strtolower($loginId);
                    if (isset($seenLoginIds[$loginKey])) {
                        $duplicate++;
                        $problems[] = [
                            'row' => $rowNumber, 'studentId' => $studentId, 'studentName' => $row['studentName'] ?? '—',
                            'loginId' => $loginId, 'status' => 'duplicate',
                            'message' => 'Duplicate login ID within uploaded file',
                        ];
                        continue;
                    }
                    $seenLoginIds[$loginKey] = true;

                    $result = $this->assign([
                        'studentId' => $studentId,
                        'examId' => $examId,
                        'studentName' => $row['studentName'] ?? null,
                        'loginId' => $loginId,
                        'password' => $password,
                    ]);

                    if ($result['success'] ?? false) {
                        $successful++;
                    } else {
                        $message = is_array($result['error'] ?? null)
                            ? ($result['error']['message'] ?? 'Could not assign this credential')
                            : ($result['error'] ?? 'Could not assign this credential');
                        $isDuplicate = str_contains((string) $message, 'already assigned');
                        $isDuplicate ? $duplicate++ : $invalid++;
                        $problems[] = [
                            'row' => $rowNumber, 'studentId' => $studentId, 'studentName' => $row['studentName'] ?? '—',
                            'loginId' => $loginId, 'status' => $isDuplicate ? 'duplicate' : 'invalid',
                            'message' => $message,
                        ];
                    }
                }

                $this->auditLog('BULK_ASSIGN', 'Exam', $examId, ['successful' => $successful, 'rows' => count($rows)]);

                return [
                    'success' => true,
                    'data' => [
                        'processed' => count($rows),
                        'successful' => $successful,
                        'duplicate' => $duplicate,
                        'invalid' => $invalid,
                        'missingStudentId' => $missingStudentId,
                        'rows' => $problems,
                    ],
                    'message' => "{$successful} of " . count($rows) . ' credential(s) assigned',
                ];
            },
            null,
            'bulkAssignCredentials'
        );
    }

    /**
     * Revoke a student's exam-hall credential
     *
     * Sets status='revoked' rather than deleting - deleting would free
     * the UNIQUE(studentId, examId) slot in a way that's indistinguishable
     * from "never assigned", losing the fact that one was issued and then
     * pulled. assign() already treats a revoked row as reissuable.
     *
     * @param string $id
     * @return array
     */
    public function revoke(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                if (!$this->examCredentialRepository->getById($id)) {
                    throw new ServiceException("Credential not found: {$id}", 'ExamCredentialService', false);
                }

                $this->examCredentialRepository->update($id, ['status' => 'revoked']);
                $this->auditLog('REVOKE', 'ExamCredential', $id, []);

                return ['success' => true, 'message' => 'Credential revoked successfully'];
            },
            null,
            'revokeCredential'
        );
    }
}
