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

    /**
     * Get payments by student ID
     *
     * @param string $studentId
     * @return array List of payments
     */
    public function getByStudentId(string $studentId): array
    {
        return $this->select(
            "SELECT * FROM {$this->table}
             WHERE studentId = ?
             ORDER BY date DESC",
            [$studentId]
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
             AND createdAt > NOW() - INTERVAL '7 days'
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
