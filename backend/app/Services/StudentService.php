<?php

namespace Nirvona\Services;

use Nirvona\Repositories\StudentRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * StudentService
 *
 * Handles all student-related business logic.
 * Extends BaseService for automatic error isolation and resilience.
 *
 * If this service fails, other services (Payment, Exam, Result) continue operating.
 */
class StudentService extends BaseService
{
    private StudentRepository $studentRepository;
    private JwtService $jwtService;

    public function __construct(
        StudentRepository $studentRepository,
        JwtService $jwtService,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->studentRepository = $studentRepository;
        $this->jwtService = $jwtService;
    }

    /**
     * Register new student. Requires a password (previously it didn't
     * even have anywhere to store one - see migration 022) and, on
     * success, logs the student straight in by returning a JWT
     * alongside the created profile.
     *
     * @param array $data Student data, including `password`
     * @return array Success status with student ID and access token
     */
    public function registerStudent(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                // Validate input
                $errors = $this->validate($data, [
                    'fullName' => ['required', 'string'],
                    'email' => ['required', 'email'],
                    'mobile' => ['required', 'numeric'],
                    'className' => ['required'],
                    'password' => ['required', 'string'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'StudentService',
                        false
                    );
                }

                if (strlen($data['password']) < 8) {
                    throw new ServiceException(
                        "Password must be at least 8 characters",
                        'StudentService',
                        false
                    );
                }

                // Check if email already exists
                if ($this->studentRepository->findByEmail($data['email'])) {
                    throw new ServiceException(
                        "Email already registered",
                        'StudentService',
                        false
                    );
                }

                // Create student
                $student = $this->studentRepository->createWithPassword([
                    'fullName' => $data['fullName'],
                    'email' => $data['email'],
                    'mobile' => $data['mobile'],
                    'className' => $data['className'],
                    'school' => $data['school'] ?? null,
                    'city' => $data['city'] ?? null,
                    'state' => $data['state'] ?? null,
                    'status' => 'active',
                    'enrolledAt' => date('Y-m-d H:i:s'),
                ], $data['password']);

                $this->auditLog('CREATE', 'Student', $student['id'], [
                    'email' => $data['email'],
                    'className' => $data['className'],
                ]);

                $token = $this->jwtService->issue($student['id'], 'student', ['email' => $student['email']]);

                return [
                    'success' => true,
                    'data' => $student,
                    'token' => $token,
                    'message' => 'Student registered successfully',
                ];
            },
            null,
            'registerStudent'
        );
    }

    /**
     * Get student by ID
     *
     * @param string $studentId
     * @return array Student data or error response
     */
    public function getStudent(string $studentId): array
    {
        return $this->executeWithFallback(
            function () use ($studentId) {
                $student = $this->studentRepository->getById($studentId);

                if (!$student) {
                    throw new ServiceException(
                        "Student not found: {$studentId}",
                        'StudentService',
                        false
                    );
                }

                return [
                    'success' => true,
                    'data' => $student,
                ];
            },
            [
                'success' => false,
                'error' => 'Unable to fetch student data',
                'studentId' => $studentId,
            ],
            'getStudent'
        );
    }

    /**
     * Update student profile
     *
     * @param string $studentId
     * @param array $data Updated data
     * @return array Success status
     */
    public function updateProfile(string $studentId, array $data): array
    {
        return $this->executeWithFallback(
            function () use ($studentId, $data) {
                // Ensure student exists
                $student = $this->studentRepository->getById($studentId);
                if (!$student) {
                    throw new ServiceException(
                        "Student not found: {$studentId}",
                        'StudentService',
                        false
                    );
                }

                // Update only allowed fields
                $allowedFields = [
                    'fullName', 'mobile', 'dateOfBirth', 'gender',
                    'school', 'city', 'state', 'address'
                ];
                $updateData = array_intersect_key($data, array_flip($allowedFields));

                $this->studentRepository->update($studentId, $updateData);

                $this->auditLog('UPDATE', 'Student', $studentId, [
                    'fields' => array_keys($updateData),
                ]);

                return [
                    'success' => true,
                    'message' => 'Profile updated successfully',
                    'data' => array_merge($student, $updateData),
                ];
            },
            null,
            'updateProfile'
        );
    }

    /**
     * Get student's enrollments
     *
     * @param string $studentId
     * @return array List of enrollments
     */
    public function getEnrollments(string $studentId): array
    {
        return $this->executeWithFallback(
            function () use ($studentId) {
                return [
                    'success' => true,
                    'data' => $this->studentRepository->getEnrollments($studentId),
                ];
            },
            [
                'success' => true,
                'data' => [],
                'message' => 'Enrollments temporarily unavailable',
            ],
            'getEnrollments'
        );
    }

    /**
     * Suspend student account
     *
     * @param string $studentId
     * @return array Success status
     */
    public function suspendStudent(string $studentId): array
    {
        return $this->executeWithFallback(
            function () use ($studentId) {
                $this->studentRepository->update($studentId, ['status' => 'suspended']);

                $this->auditLog('SUSPEND', 'Student', $studentId, [
                    'reason' => 'Admin action',
                ]);

                return [
                    'success' => true,
                    'message' => 'Student suspended successfully',
                ];
            },
            null,
            'suspendStudent'
        );
    }
}
