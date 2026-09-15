<?php

namespace Nirvona\Repositories;

/**
 * NotificationRepository
 *
 * Data Access Layer for the notification log (notifications) and its
 * per-student portal delivery/read state (notification_recipients).
 */
class NotificationRepository extends BaseRepository
{
    protected string $table = 'notifications';

    /**
     * Create a notification, exposing the DB's `recipientCount` column
     * as `recipients` - the field name the frontend's AppNotification
     * type actually uses (see toFrontendShape()).
     *
     * @param array $data
     * @return array
     */
    public function create(array $data): array
    {
        return $this->toFrontendShape(parent::create($data));
    }

    /**
     * List the notification log, most recent first (admin view).
     *
     * @param int $limit
     * @return array
     */
    public function getForAdmin(int $limit = 50): array
    {
        $rows = $this->select(
            "SELECT * FROM {$this->table} ORDER BY createdAt DESC LIMIT ?",
            [$limit]
        );
        return array_map([$this, 'toFrontendShape'], $rows);
    }

    /**
     * A student's personal notification feed (portal-channel
     * notifications they were fanned out to), most recent first, with
     * their own read state.
     *
     * @param string $studentId
     * @param int $limit
     * @return array Rows include the notification fields plus isRead/readAt
     */
    public function getForStudent(string $studentId, int $limit = 50): array
    {
        $rows = $this->select(
            "SELECT n.*, nr.isRead, nr.readAt
             FROM notification_recipients nr
             JOIN {$this->table} n ON n.id = nr.notificationId
             WHERE nr.studentId = ?
             ORDER BY n.createdAt DESC
             LIMIT ?",
            [$studentId, $limit]
        );
        return array_map([$this, 'toFrontendShape'], $rows);
    }

    /**
     * @param array $row
     * @return array
     */
    private function toFrontendShape(array $row): array
    {
        if (array_key_exists('recipientCount', $row)) {
            $row['recipients'] = $row['recipientCount'];
            unset($row['recipientCount']);
        }
        // AppNotification.read, not isRead - only present on the
        // student-feed join (getForStudent), not the plain admin list.
        // Driver-dependent representation of BOOLEAN/TINYINT(1): PDO_PGSQL
        // returned the strings "t"/"f", PDO_MYSQL (with
        // ATTR_STRINGIFY_FETCHES off) returns a real int 1/0 - (bool) 'f'
        // is true and (bool) 0 loses nothing but this still has to check
        // every real shape explicitly rather than assume one driver.
        if (array_key_exists('isRead', $row)) {
            $row['read'] = in_array($row['isRead'], ['t', true, 1, '1'], true);
            unset($row['isRead']);
        }
        return $row;
    }

    /**
     * Count unread portal notifications for a student - powers the
     * unread badge in the portal shell.
     *
     * @param string $studentId
     * @return int
     */
    public function getUnreadCount(string $studentId): int
    {
        $result = $this->selectOne(
            "SELECT COUNT(*) as total FROM notification_recipients
             WHERE studentId = ? AND isRead = FALSE",
            [$studentId]
        );
        return (int) ($result['total'] ?? 0);
    }

    /**
     * Mark one notification as read for a student
     *
     * @param string $notificationId
     * @param string $studentId
     * @return bool
     */
    public function markRead(string $notificationId, string $studentId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE notification_recipients SET isRead = TRUE, readAt = NOW()
             WHERE notificationId = ? AND studentId = ?"
        );
        return $stmt->execute([$notificationId, $studentId]);
    }

    /**
     * Mark every notification read for a student
     *
     * @param string $studentId
     * @return int Number of rows updated
     */
    public function markAllRead(string $studentId): int
    {
        $stmt = $this->db->prepare(
            "UPDATE notification_recipients SET isRead = TRUE, readAt = NOW()
             WHERE studentId = ? AND isRead = FALSE"
        );
        $stmt->execute([$studentId]);
        return $stmt->rowCount();
    }

    /**
     * Fan a notification out to a list of students (portal delivery).
     * Ignores students already attached (idempotent).
     *
     * @param string $notificationId
     * @param string[] $studentIds
     * @return void
     */
    public function attachRecipients(string $notificationId, array $studentIds): void
    {
        if (empty($studentIds)) {
            return;
        }

        // MySQL has no ON CONFLICT - ON DUPLICATE KEY UPDATE against the
        // UNIQUE(notificationId, studentId) constraint (migration 025) is
        // the equivalent "insert, or do nothing if it already exists"
        // (the self-assignment is a true no-op, it only exists to make
        // this an UPDATE instead of an error on the duplicate key).
        $stmt = $this->db->prepare(
            "INSERT INTO notification_recipients (notificationId, studentId)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE id = id"
        );

        foreach ($studentIds as $studentId) {
            $stmt->execute([$notificationId, $studentId]);
        }
    }

    /**
     * Re-attempt a failed notification (flip status back to sent) - the
     * admin log's "Retry" action.
     *
     * @param string $notificationId
     * @return bool
     */
    public function retry(string $notificationId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET status = 'sent', updatedAt = NOW()
             WHERE id = ? AND status = 'failed'"
        );
        return $stmt->execute([$notificationId]);
    }
}
