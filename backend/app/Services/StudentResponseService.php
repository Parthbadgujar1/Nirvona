<?php

namespace Nirvona\Services;

use Nirvona\Repositories\StudentResponseRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * StudentResponseService
 *
 * Handles student response-sheet upload & retrieval with error
 * isolation.
 */
class StudentResponseService extends BaseService
{
    private StudentResponseRepository $studentResponseRepository;

    public function __construct(
        StudentResponseRepository $studentResponseRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->studentResponseRepository = $studentResponseRepository;
    }

    /**
     * Get a student's response sheet for an exam
     *
     * @param string $examId
     * @param string $studentId
     * @return array
     */
    public function getForStudent(string $examId, string $studentId): array
    {
        return $this->executeWithFallback(
            function () use ($examId, $studentId) {
                $response = $this->studentResponseRepository->findByStudentAndExam($examId, $studentId);

                if (!$response) {
                    throw new ServiceException("Response sheet not found", 'StudentResponseService', false);
                }

                return ['success' => true, 'data' => $response];
            },
            ['success' => false, 'error' => 'Unable to fetch response sheet'],
            'getResponseForStudent'
        );
    }

    /**
     * List all response sheets uploaded for an exam
     *
     * @param string $examId
     * @return array
     */
    public function getByExam(string $examId): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->studentResponseRepository->getByExam($examId)],
            ['success' => true, 'data' => []],
            'getResponsesByExam'
        );
    }

    /**
     * One summary row per exam with any uploaded responses - backs the
     * admin "Student Responses" overview page. There was no route for
     * this at all (only the per-exam, per-student endpoints existed),
     * so the page's own listing call 404'd on every load.
     *
     * @return array
     */
    public function listUploads(): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->studentResponseRepository->getUploadSummaries()],
            ['success' => true, 'data' => []],
            'listResponseUploads'
        );
    }

    /**
     * Upload a student's response sheet for evaluation
     *
     * @param array $data examId, studentId, rows
     * @return array
     */
    public function upload(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $errors = $this->validate($data, [
                    'examId' => ['required'],
                    'studentId' => ['required'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'StudentResponseService',
                        false
                    );
                }

                $existing = $this->studentResponseRepository->findByStudentAndExam(
                    $data['examId'],
                    $data['studentId']
                );

                if ($existing) {
                    throw new ServiceException(
                        "Response sheet already uploaded for this student/exam",
                        'StudentResponseService',
                        false
                    );
                }

                $response = $this->studentResponseRepository->create([
                    'examId' => $data['examId'],
                    'studentId' => $data['studentId'],
                    'rows' => $data['rows'] ?? [],
                    'validation' => 'pending',
                    'processing' => 'queued',
                ]);

                $this->auditLog('UPLOAD', 'StudentResponse', $response['id'], [
                    'examId' => $data['examId'],
                    'studentId' => $data['studentId'],
                ]);

                return ['success' => true, 'data' => $response, 'message' => 'Response sheet uploaded successfully'];
            },
            null,
            'uploadStudentResponse'
        );
    }
}
