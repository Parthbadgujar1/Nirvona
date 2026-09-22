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

                // Optional at sign-up, same three values the profile editor and
                // the admin edit dialog accept.
                if (
                    !empty($data['gender'])
                    && !in_array($data['gender'], ['male', 'female', 'other'], true)
                ) {
                    throw new ServiceException(
                        "Invalid gender",
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

                // The registration form collects a date of birth (it is printed on
                // the admit card) - it used to be silently dropped here.
                $dateOfBirth = null;
                if (!empty($data['dateOfBirth'])) {
                    $parsed = \DateTime::createFromFormat('Y-m-d', (string) $data['dateOfBirth']);
                    if ($parsed && $parsed->format('Y-m-d') === $data['dateOfBirth']) {
                        $dateOfBirth = $data['dateOfBirth'];
                    }
                }

                // Create student
                $student = $this->studentRepository->createWithPassword([
                    'fullName' => $data['fullName'],
                    'email' => $data['email'],
                    'mobile' => $data['mobile'],
                    'dateOfBirth' => $dateOfBirth,
                    'className' => $data['className'],
                    'gender' => !empty($data['gender']) ? $data['gender'] : null,
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

                // Only fields a student may legitimately change themselves -
                // id, status, enrolledAt, passwordHash etc. are deliberately
                // excluded (the student id is assigned once and never edited;
                // admins change the rest via AdminService).
                $allowedFields = [
                    'fullName', 'email', 'mobile', 'dateOfBirth', 'className', 'gender',
                    'school', 'city', 'state', 'address',
                    'guardianName', 'guardianMobile', 'notificationPrefs',
                ];
                $updateData = array_intersect_key($data, array_flip($allowedFields));

                foreach ($updateData as $key => $value) {
                    if (is_string($value)) {
                        $updateData[$key] = trim($value);
                    }
                }
                // A blank required-ish field from a form means "leave it as it is",
                // never "erase it" (a student without a date of birth yet, say).
                foreach (['dateOfBirth', 'className'] as $keep) {
                    if (array_key_exists($keep, $updateData) && $updateData[$keep] === '') {
                        unset($updateData[$keep]);
                    }
                }

                $phone = '/^[0-9+\s-]{10,15}$/';
                $errors = [];

                if (array_key_exists('fullName', $updateData) && mb_strlen($updateData['fullName']) < 3) {
                    $errors['fullName'] = 'Enter a full name (at least 3 characters).';
                }
                if (array_key_exists('email', $updateData)) {
                    if (!filter_var($updateData['email'], FILTER_VALIDATE_EMAIL)) {
                        $errors['email'] = 'Enter a valid email address.';
                    } else {
                        // Email is the login identifier - it must stay unique
                        // across every *other* account.
                        $existing = $this->studentRepository->findByEmail($updateData['email']);
                        if ($existing && $existing['id'] !== $studentId) {
                            $errors['email'] = 'That email is already registered to another account.';
                        }
                    }
                }
                if (array_key_exists('mobile', $updateData) && !preg_match($phone, $updateData['mobile'])) {
                    $errors['mobile'] = 'Enter a valid mobile number.';
                }
                if (array_key_exists('dateOfBirth', $updateData)) {
                    $dob = \DateTime::createFromFormat('Y-m-d', (string) $updateData['dateOfBirth']);
                    if (!$dob || $dob->format('Y-m-d') !== $updateData['dateOfBirth']) {
                        $errors['dateOfBirth'] = 'Enter a valid date of birth.';
                    } else {
                        $age = $dob->diff(new \DateTime('today'))->y;
                        if ($dob > new \DateTime('today') || $age < 12 || $age > 40) {
                            $errors['dateOfBirth'] = 'Enter a date of birth between 12 and 40 years of age.';
                        }
                    }
                }
                if (
                    array_key_exists('gender', $updateData)
                    && $updateData['gender'] !== ''
                    && !in_array($updateData['gender'], ['male', 'female', 'other'], true)
                ) {
                    $errors['gender'] = 'Choose a valid gender.';
                }
                if (array_key_exists('className', $updateData)) {
                    // Keep whatever an admin may have set before; otherwise
                    // accept only the classes the registration form offers.
                    $allowedClasses = ['Class 11', 'Class 12', 'Dropper', 'Other'];
                    if (
                        !in_array($updateData['className'], $allowedClasses, true)
                        && $updateData['className'] !== ($student['className'] ?? null)
                    ) {
                        $errors['className'] = 'Choose a valid class.';
                    }
                }
                if (
                    !empty($updateData['guardianMobile'] ?? '')
                    && !preg_match($phone, $updateData['guardianMobile'])
                ) {
                    $errors['guardianMobile'] = 'Enter a valid guardian mobile number.';
                }

                if (isset($updateData['notificationPrefs'])) {
                    $prefs = is_array($updateData['notificationPrefs']) ? $updateData['notificationPrefs'] : [];
                    $current = is_array($student['notificationPrefs'] ?? null) ? $student['notificationPrefs'] : [];
                    $merged = [];
                    foreach (['whatsapp', 'sms', 'email'] as $channel) {
                        $merged[$channel] = array_key_exists($channel, $prefs)
                            ? (bool) $prefs[$channel]
                            : (bool) ($current[$channel] ?? true);
                    }
                    // Exam/result notifications must always reach the portal.
                    $merged['portal'] = true;
                    $updateData['notificationPrefs'] = $merged;
                }

                if (!empty($errors)) {
                    throw new ServiceException(implode(' ', $errors), 'StudentService', false);
                }

                // Optional text columns: an emptied field is stored as NULL.
                foreach (['school', 'city', 'state', 'address', 'guardianName', 'guardianMobile', 'gender'] as $optional) {
                    if (array_key_exists($optional, $updateData) && $updateData[$optional] === '') {
                        $updateData[$optional] = null;
                    }
                }

                if (!empty($updateData)) {
                    $this->studentRepository->update($studentId, $updateData);
                }

                $this->auditLog('UPDATE', 'Student', $studentId, [
                    'fields' => array_keys($updateData),
                ]);

                return [
                    'success' => true,
                    'message' => 'Profile updated successfully',
                    'data' => $this->studentRepository->getById($studentId),
                ];
            },
            null,
            'updateProfile'
        );
    }

    /**
     * Change a student's own portal password.
     *
     * Requires the current password (a left-open session alone shouldn't
     * be enough to lock the owner out) and enforces the same strength
     * rule the registration form advertises.
     *
     * @param string $studentId
     * @param string $currentPassword
     * @param string $newPassword
     * @return array
     */
    public function changePassword(string $studentId, string $currentPassword, string $newPassword): array
    {
        return $this->executeWithFallback(
            function () use ($studentId, $currentPassword, $newPassword) {
                $student = $this->studentRepository->getById($studentId);
                if (!$student) {
                    throw new ServiceException("Student not found: {$studentId}", 'StudentService', false);
                }

                // findByEmail() is the one accessor that keeps passwordHash
                // (getById strips it) - it's what login verification uses.
                $withHash = $this->studentRepository->findByEmail($student['email']);
                if (
                    !$withHash
                    || empty($withHash['passwordHash'])
                    || !password_verify($currentPassword, $withHash['passwordHash'])
                ) {
                    throw new ServiceException('Your current password is incorrect.', 'StudentService', false);
                }

                if (
                    strlen($newPassword) < 8
                    || !preg_match('/[A-Z]/', $newPassword)
                    || !preg_match('/[0-9]/', $newPassword)
                ) {
                    throw new ServiceException(
                        'New password must be at least 8 characters with a capital letter and a number.',
                        'StudentService',
                        false
                    );
                }

                if (hash_equals($currentPassword, $newPassword)) {
                    throw new ServiceException(
                        'New password must be different from your current password.',
                        'StudentService',
                        false
                    );
                }

                $this->studentRepository->update($studentId, [
                    'passwordHash' => password_hash($newPassword, PASSWORD_DEFAULT),
                ]);

                $this->auditLog('CHANGE_PASSWORD', 'Student', $studentId, []);

                return ['success' => true, 'message' => 'Password updated successfully'];
            },
            null,
            'changePassword'
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
