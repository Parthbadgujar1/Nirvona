<?php

namespace Nirvona\Services;

use Nirvona\Repositories\StudentRepository;
use Nirvona\Repositories\AdminRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * AuthService
 *
 * Login (student + admin) and "who am I" lookups, backed by real
 * password verification and JwtService-issued tokens. Registration
 * lives on StudentService (it owns student creation end-to-end); this
 * is the rest of the auth surface that never existed before -
 * AuthMiddleware was defined but never wired up, and there was no
 * `admins` table for AdminController's "requires admin authentication"
 * claim to check against.
 */
class AuthService extends BaseService
{
    private StudentRepository $studentRepository;
    private AdminRepository $adminRepository;
    private JwtService $jwtService;

    public function __construct(
        StudentRepository $studentRepository,
        AdminRepository $adminRepository,
        JwtService $jwtService,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->studentRepository = $studentRepository;
        $this->adminRepository = $adminRepository;
        $this->jwtService = $jwtService;
    }

    /**
     * Log a student in
     *
     * @param string $email
     * @param string $password
     * @return array
     */
    public function loginStudent(string $email, string $password): array
    {
        return $this->executeWithFallback(
            function () use ($email, $password) {
                if (!$this->studentRepository->verifyPassword($email, $password)) {
                    throw new ServiceException("Invalid email or password", 'AuthService', false);
                }

                $student = $this->studentRepository->findByEmail($email);
                unset($student['passwordHash']);

                if (($student['status'] ?? 'active') !== 'active') {
                    throw new ServiceException("Account is not active", 'AuthService', false);
                }

                $token = $this->jwtService->issue($student['id'], 'student', ['email' => $student['email']]);

                $this->auditLog('LOGIN', 'Student', $student['id'], []);

                return [
                    'success' => true,
                    'data' => $student,
                    'token' => $token,
                    'message' => 'Login successful',
                ];
            },
            ['success' => false, 'error' => 'Invalid email or password'],
            'loginStudent'
        );
    }

    /**
     * Log an admin in
     *
     * @param string $email
     * @param string $password
     * @return array
     */
    public function loginAdmin(string $email, string $password): array
    {
        return $this->executeWithFallback(
            function () use ($email, $password) {
                if (!$this->adminRepository->verifyPassword($email, $password)) {
                    throw new ServiceException("Invalid email or password", 'AuthService', false);
                }

                $admin = $this->adminRepository->findByEmail($email);
                unset($admin['passwordHash']);

                if (($admin['status'] ?? 'active') !== 'active') {
                    throw new ServiceException("Account is not active", 'AuthService', false);
                }

                $token = $this->jwtService->issue($admin['id'], 'admin', [
                    'email' => $admin['email'],
                    'adminRole' => $admin['role'],
                ]);

                $this->auditLog('LOGIN', 'Admin', $admin['id'], []);

                return [
                    'success' => true,
                    'data' => $admin,
                    'token' => $token,
                    'message' => 'Login successful',
                ];
            },
            ['success' => false, 'error' => 'Invalid email or password'],
            'loginAdmin'
        );
    }

    /**
     * Resolve the current user from a verified token's claims
     *
     * @param string $userId
     * @param string $role "student" | "admin"
     * @return array
     */
    public function me(string $userId, string $role): array
    {
        return $this->executeWithFallback(
            function () use ($userId, $role) {
                if ($role === 'admin') {
                    $admin = $this->adminRepository->getPublicById($userId);
                    if (!$admin) {
                        throw new ServiceException("Admin not found", 'AuthService', false);
                    }
                    return ['success' => true, 'data' => $admin];
                }

                $student = $this->studentRepository->getById($userId);
                if (!$student) {
                    throw new ServiceException("Student not found", 'AuthService', false);
                }
                unset($student['passwordHash']);

                return ['success' => true, 'data' => $student];
            },
            ['success' => false, 'error' => 'Unable to fetch current user'],
            'me'
        );
    }
}
