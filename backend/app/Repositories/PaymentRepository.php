<?php

namespace Nirvona\Repositories;

/**
 * PaymentRepository
 *
 * Data Access Layer for Payment model.
 * Handles all payment-related database queries.
 */
class PaymentRepository extends BaseRepository
{
    protected string $table = 'payments';

    /** Columns every listing method joins in so a payment row carries
     * what it actually displays as (package name, duration, buyer
     * name) instead of just the raw ids the frontend's `Payment` type
     * has no use for on their own. Plain `SELECT *` here previously
     * left `packageName`/`studentName`/`duration` undefined on every
     * payment the frontend rendered - visible as a payment history row
     * whose "package" column showed the gateway method ("razorpay")
     * instead of a package name, because that was the only string on
     * the row the table happened to have a value for. */
    private const JOIN_SQL = "
        LEFT JOIN packages pkg ON pkg.id = p.packageId
        LEFT JOIN students s ON s.id = p.studentId
    ";
    private const JOINED_COLUMNS = "p.*, pkg.name as packageName, pkg.duration as duration, s.fullName as studentName";

    /**
     * Get payments by student ID
     *
     * @param string $studentId
     * @return array List of payments
     */
    public function getByStudentId(string $studentId): array
    {
        return $this->select(
            "SELECT " . self::JOINED_COLUMNS . "
             FROM {$this->table} p " . self::JOIN_SQL . "
             WHERE p.studentId = ?
             ORDER BY p.date DESC",
            [$studentId]
        );
    }

    /**
     * Get all payments (admin listing), paginated - overrides
     * BaseRepository::getAll() to include the same package/student
     * joins as getByStudentId() above.
     *
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function getAll(int $limit = 100, int $offset = 0): array
    {
        return $this->select(
            "SELECT " . self::JOINED_COLUMNS . "
             FROM {$this->table} p " . self::JOIN_SQL . "
             ORDER BY p.date DESC
             LIMIT ? OFFSET ?",
            [$limit, $offset]
        );
    }

    /**
     * Get payments by status
     *
     * @param string $status
     * @return array List of payments
     */
    public function getByStatus(string $status): array
    {
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE status = ?
             ORDER BY date DESC",
            [$status]
        );
    }

    /**
     * Get pending payments
     *
     * @return array Pending payments
     */
    public function getPending(): array
    {
        return $this->getByStatus('pending');
    }

    /**
     * Get successful payments
     *
     * @return array Successful payments
     */
    public function getSuccessful(): array
    {
        return $this->getByStatus('successful');
    }

    /**
     * Get total revenue
     *
     * @param ?string $courseSlug Filter by course (optional)
     * @param ?string $startDate Start date (YYYY-MM-DD)
     * @param ?string $endDate End date (YYYY-MM-DD)
     * @return float Total revenue
     */
    public function getTotalRevenue(
        ?string $courseSlug = null,
        ?string $startDate = null,
        ?string $endDate = null
    ): float {
        $query = "SELECT SUM(total) as revenue FROM {$this->table} WHERE status = 'successful'";
        $params = [];

        if ($courseSlug) {
            $query .= " AND courseSlug = ?";
            $params[] = $courseSlug;
        }

        if ($startDate) {
            $query .= " AND DATE(date) >= ?";
            $params[] = $startDate;
        }

        if ($endDate) {
            $query .= " AND DATE(date) <= ?";
            $params[] = $endDate;
        }

        $result = $this->selectOne($query, $params);
        return (float) ($result['revenue'] ?? 0);
    }

    /**
     * Get payment statistics
     *
     * @return array Payment stats
     */
    public function getStats(): array
    {
        return $this->selectOne(
            "SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'successful' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'successful' THEN total ELSE 0 END) as totalRevenue,
                AVG(CASE WHEN status = 'successful' THEN total END) as averageTransaction
             FROM {$this->table}"
        ) ?? [];
    }

    /**
     * Get monthly revenue/purchase-count totals for successful payments,
     * grouped by calendar month. Only returns months that actually have
     * at least one payment - the caller fills in zero for missing months
     * (see AdminService::getRevenueTrend()) so the chart still shows a
     * continuous run of months.
     *
     * @param int $months How many months back to include
     * @return array Rows: {ym: "2026-09", revenue: float, purchases: int}
     */
    public function getMonthlyRevenue(int $months = 6): array
    {
        // DATE_FORMAT/DATE_SUB, not Postgres's TO_CHAR/`::INTERVAL` cast -
        // neither exists in MySQL.
        return $this->select(
            "SELECT DATE_FORMAT(date, '%Y-%m') as ym,
                    SUM(total) as revenue,
                    COUNT(*) as purchases
             FROM {$this->table}
             WHERE status = 'successful'
               AND date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
             GROUP BY DATE_FORMAT(date, '%Y-%m')
             ORDER BY ym ASC",
            [$months]
        );
    }

    /**
     * Get payments by date range
     *
     * @param string $startDate
     * @param string $endDate
     * @return array Payments in range
     */
    public function getByDateRange(string $startDate, string $endDate): array
    {
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE DATE(date) BETWEEN ? AND ?
             ORDER BY date DESC",
            [$startDate, $endDate]
        );
    }

    /**
     * Get failed payments for retry
     *
     * @return array Failed payments
     */
    public function getFailedForRetry(): array
    {
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE status = 'failed'
             AND createdAt > NOW() - INTERVAL 7 DAY
             AND retryCount < 3
             ORDER BY createdAt ASC
             LIMIT 100"
        );
    }

    /**
     * Increment retry count
     *
     * @param string $paymentId
     * @return bool
     */
    public function incrementRetryCount(string $paymentId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET retryCount = retryCount + 1 WHERE id = ?"
        );
        return $stmt->execute([$paymentId]);
    }
}
