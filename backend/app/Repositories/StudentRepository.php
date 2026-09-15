<?php

namespace Nirvona\Repositories;

/**
 * StudentRepository
 *
 * Data Access Layer for Student model.
 * Centralizes all database queries related to students.
 * Makes it easy to swap database implementations.
 */
class StudentRepository extends BaseRepository
{
    protected string $table = 'students';

    /**
     * Get by ID with the password hash stripped. `SELECT *` on this
     * table includes passwordHash - every generic caller (getStudent,
     * updateProfile, admin listings, ...) goes through here or getAll(),
     * so this is the one place that needs to strip it for all of them.
     * findByEmail() deliberately keeps it - that's the login-verification
     * path, guarded by AuthService/StudentRepository::verifyPassword().
     *
     * @param string $id
     * @return ?array
     */
    public function getById(string $id): ?array
    {
        $row = parent::getById($id);
        if ($row) {
            unset($row['passwordHash']);
        }
        return $row;
    }

    /**
     * Get all students with password hashes stripped
     *
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function getAll(int $limit = 100, int $offset = 0): array
    {
        return $this->stripPasswordHashes(parent::getAll($limit, $offset));
    }

    /**
     * Find student by email
     *
     * @param string $email
     * @return ?array Student data or null
     */
    public function findByEmail(string $email): ?array
    {
        return $this->selectOne(
            "SELECT * FROM {$this->table} WHERE email = ? LIMIT 1",
            [$email]
        );
    }

    /**
     * Create a student, hashing the plaintext password before storage
     *
     * @param array $data
     * @param string $plainPassword
     * @return array Created row (password hash excluded)
     */
    public function createWithPassword(array $data, string $plainPassword): array
    {
        $data['passwordHash'] = password_hash($plainPassword, PASSWORD_DEFAULT);
        $created = $this->create($data);
        unset($created['passwordHash']);
        return $created;
    }

    /**
     * Verify a login attempt against the stored hash
     *
     * @param string $email
     * @param string $plainPassword
     * @return bool
     */
    public function verifyPassword(string $email, string $plainPassword): bool
    {
        $row = $this->findByEmail($email);
        if (!$row || empty($row['passwordHash'])) {
            return false;
        }
        return password_verify($plainPassword, $row['passwordHash']);
    }

    /**
     * Find active students by class
     *
     * @param string $className
     * @return array List of students
     */
    public function findByClass(string $className): array
    {
        return $this->stripPasswordHashes($this->select(
            "SELECT * FROM {$this->table} WHERE className = ? AND status = 'active'",
            [$className]
        ));
    }

    /**
     * Get student's enrollments
     *
     * @param string $studentId
     * @return array List of enrollments
     */
    public function getEnrollments(string $studentId): array
    {
        return $this->select(
            "SELECT e.*, p.name as packageName, c.name as courseName
             FROM enrollments e
             JOIN packages p ON e.packageId = p.id
             JOIN courses c ON e.courseSlug = c.slug
             WHERE e.studentId = ?
             ORDER BY e.startDate DESC",
            [$studentId]
        );
    }

    /**
     * Count active students
     *
     * @return int Total active students
     */
    public function countActive(): int
    {
        $result = $this->selectOne(
            "SELECT COUNT(*) as total FROM {$this->table} WHERE status = 'active'"
        );
        return $result['total'] ?? 0;
    }

    /**
     * Get students by city
     *
     * @param string $city
     * @return array List of students
     */
    public function findByCity(string $city): array
    {
        return $this->stripPasswordHashes($this->select(
            "SELECT * FROM {$this->table} WHERE city = ? AND status = 'active'",
            [$city]
        ));
    }

    /**
     * Get leaderboard for a course
     *
     * @param string $courseSlug
     * @param int $limit
     * @return array Top students with scores
     */
    public function getLeaderboard(string $courseSlug, int $limit = 100): array
    {
        return $this->select(
            "SELECT s.id, s.fullName, s.className, AVG(r.percentage) as avgPercentage,
                    COUNT(r.id) as totalExams, MAX(r.`rank`) as bestRank
             FROM {$this->table} s
             LEFT JOIN results r ON s.id = r.studentId
             WHERE r.courseSlug = ? AND s.status = 'active'
             GROUP BY s.id, s.fullName, s.className
             ORDER BY avgPercentage DESC, totalExams DESC
             LIMIT ?",
            [$courseSlug, $limit]
        );
    }

    /**
     * Get monthly new-registration counts, grouped by calendar month.
     * Only returns months with at least one registration - the caller
     * fills in zero for missing months.
     *
     * @param int $months How many months back to include
     * @return array Rows: {ym: "2026-09", registrations: int}
     */
    public function getMonthlyRegistrations(int $months = 6): array
    {
        // DATE_FORMAT/DATE_SUB, not Postgres's TO_CHAR/`::INTERVAL` cast -
        // neither exists in MySQL.
        return $this->select(
            "SELECT DATE_FORMAT(enrolledAt, '%Y-%m') as ym,
                    COUNT(*) as registrations
             FROM {$this->table}
             WHERE enrolledAt >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
             GROUP BY DATE_FORMAT(enrolledAt, '%Y-%m')
             ORDER BY ym ASC",
            [$months]
        );
    }

    /**
     * Search students by name or email
     *
     * @param string $query Search query
     * @return array Matching students
     */
    public function search(string $query): array
    {
        $query = '%' . $query . '%';
        // Plain LIKE, not case-sensitive here (was ILIKE under Postgres) -
        // every text column is utf8mb4_unicode_ci, MySQL's default
        // case-insensitive collation, so LIKE already matches regardless
        // of case.
        return $this->stripPasswordHashes($this->select(
            "SELECT * FROM {$this->table}
             WHERE (fullName LIKE ? OR email LIKE ?)
             AND status = 'active'
             LIMIT 50",
            [$query, $query]
        ));
    }

    /**
     * @param array $rows
     * @return array
     */
    private function stripPasswordHashes(array $rows): array
    {
        return array_map(function (array $row) {
            unset($row['passwordHash']);
            return $row;
        }, $rows);
    }
}
