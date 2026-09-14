<?php

namespace Nirvona\Services;

use Nirvona\Repositories\ExamCredentialRepository;
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

    public function __construct(
        ExamCredentialRepository $examCredentialRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->examCredentialRepository = $examCredentialRepository;
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

                if ($this->examCredentialRepository->findByStudentAndExam($data['studentId'], $data['examId'])) {
                    throw new ServiceException(
                        "Credential already assigned for this student/exam",
                        'ExamCredentialService',
                        false
                    );
                }

                $loginId = $data['loginId'] ?? ('CBT' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6)));
                $plainPassword = $data['password'] ?? bin2hex(random_bytes(4));

                $credential = $this->examCredentialRepository->createWithPassword([
                    'studentId' => $data['studentId'],
                    'examId' => $data['examId'],
                    'studentName' => $data['studentName'] ?? null,
                    'loginId' => $loginId,
                    'status' => 'assigned',
                    'assignedAt' => date('Y-m-d H:i:s'),
                ], $plainPassword);

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
}
