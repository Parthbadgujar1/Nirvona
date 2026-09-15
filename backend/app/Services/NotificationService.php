<?php

namespace Nirvona\Services;

use Nirvona\Repositories\NotificationRepository;
use Nirvona\Repositories\ExamCandidateRepository;
use Nirvona\Repositories\ExamRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * NotificationService
 *
 * Handles sending notifications (SMS, Email, WhatsApp) with error isolation.
 * If one channel fails, others continue operating.
 *
 * broadcast()/getForAdmin()/getForStudent()/markRead() etc. below are new:
 * this service used to only mock-send (see sendViaChannel() and friends
 * further down) with nothing ever persisted anywhere -
 * /api/admin/notifications and /api/students/me/notifications both
 * 404'd, and the "Send"/"Retry"/"Mark read" buttons in the frontend
 * only ever touched local React state.
 */
class NotificationService extends BaseService
{
    private NotificationRepository $notificationRepository;
    private ExamCandidateRepository $examCandidateRepository;
    private ExamRepository $examRepository;

    public function __construct(
        NotificationRepository $notificationRepository,
        ExamCandidateRepository $examCandidateRepository,
        ExamRepository $examRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->notificationRepository = $notificationRepository;
        $this->examCandidateRepository = $examCandidateRepository;
        $this->examRepository = $examRepository;
    }

    /**
     * Compose and send a notification to every candidate of an exam, one
     * notification row per channel. The "portal" channel additionally
     * fans out to notification_recipients so it shows up in each
     * candidate's personal feed; other channels (whatsapp/sms/email)
     * are logged but not something a student "reads" in-app.
     *
     * @param array $data title, message, type, channels[], examId
     * @return array
     */
    public function broadcast(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $errors = $this->validate($data, [
                    'title' => ['required', 'string'],
                    'message' => ['required', 'string'],
                    'examId' => ['required'],
                    'channels' => ['required'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'NotificationService',
                        false
                    );
                }

                $channels = $data['channels'];
                if (!is_array($channels) || empty($channels)) {
                    throw new ServiceException("At least one channel is required", 'NotificationService', false);
                }

                $exam = $this->examRepository->getById($data['examId']);
                if (!$exam) {
                    throw new ServiceException("Exam not found: {$data['examId']}", 'NotificationService', false);
                }

                $candidates = $this->examCandidateRepository->getByExam($data['examId']);
                $studentIds = array_column($candidates, 'studentId');
                $audience = "{$exam['name']} candidates";

                $created = [];
                foreach ($channels as $channel) {
                    $channelResult = $this->sendViaChannel($channel, $data['examId'], $data['message']);

                    $notification = $this->notificationRepository->create([
                        'title' => $data['title'],
                        'message' => $data['message'],
                        'type' => $data['type'] ?? 'general',
                        'channel' => $channel,
                        'audience' => $audience,
                        'recipientCount' => count($studentIds),
                        'status' => $channelResult['success'] ? 'sent' : 'failed',
                    ]);

                    if ($channel === 'portal' && $channelResult['success']) {
                        $this->notificationRepository->attachRecipients($notification['id'], $studentIds);
                    }

                    $created[] = $notification;
                }

                $this->auditLog('BROADCAST', 'Notification', $data['examId'], [
                    'channels' => $channels,
                    'recipients' => count($studentIds),
                ]);

                return [
                    'success' => true,
                    'data' => $created,
                    'message' => 'Notification queued for ' . count($studentIds) . ' recipient(s)',
                ];
            },
            null,
            'broadcast'
        );
    }

    /**
     * Admin view of the notification log
     *
     * @return array
     */
    public function getForAdmin(): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->notificationRepository->getForAdmin()],
            ['success' => true, 'data' => []],
            'getNotificationsForAdmin'
        );
    }

    /**
     * A student's personal notification feed
     *
     * @param string $studentId
     * @return array
     */
    public function getForStudent(string $studentId): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->notificationRepository->getForStudent($studentId)],
            ['success' => true, 'data' => []],
            'getNotificationsForStudent'
        );
    }

    /**
     * Unread portal-notification count for a student
     *
     * @param string $studentId
     * @return array
     */
    public function getUnreadCount(string $studentId): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => ['count' => $this->notificationRepository->getUnreadCount($studentId)]],
            ['success' => true, 'data' => ['count' => 0]],
            'getUnreadNotificationCount'
        );
    }

    /**
     * Mark one notification read for a student
     *
     * @param string $notificationId
     * @param string $studentId
     * @return array
     */
    public function markRead(string $notificationId, string $studentId): array
    {
        return $this->executeWithFallback(
            function () use ($notificationId, $studentId) {
                $this->notificationRepository->markRead($notificationId, $studentId);
                return ['success' => true, 'message' => 'Marked as read'];
            },
            null,
            'markNotificationRead'
        );
    }

    /**
     * Mark every notification read for a student
     *
     * @param string $studentId
     * @return array
     */
    public function markAllRead(string $studentId): array
    {
        return $this->executeWithFallback(
            function () use ($studentId) {
                $count = $this->notificationRepository->markAllRead($studentId);
                return ['success' => true, 'message' => "{$count} notification(s) marked as read"];
            },
            null,
            'markAllNotificationsRead'
        );
    }

    /**
     * Re-attempt a failed notification
     *
     * @param string $notificationId
     * @return array
     */
    public function retry(string $notificationId): array
    {
        return $this->executeWithFallback(
            function () use ($notificationId) {
                $this->notificationRepository->retry($notificationId);
                return ['success' => true, 'message' => 'Notification requeued'];
            },
            null,
            'retryNotification'
        );
    }

    /**
     * Delete a notification. notification_recipients.notificationId is
     * ON DELETE CASCADE (025_create_notification_recipients_table), so
     * this also removes it from every recipient's in-app feed - unlike
     * the course/package/student cases, there's no financial or audit
     * reason to keep it around, so a plain delete (no soft-delete guard)
     * is correct here.
     *
     * @param string $id
     * @return array
     */
    public function delete(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                if (!$this->notificationRepository->getById($id)) {
                    throw new ServiceException("Notification not found: {$id}", 'NotificationService', false);
                }

                $this->notificationRepository->delete($id);
                $this->auditLog('DELETE', 'Notification', $id, []);

                return ['success' => true, 'message' => 'Notification deleted successfully'];
            },
            null,
            'deleteNotification'
        );
    }

    /**
     * Send exam notification
     *
     * @param array $notificationData
     * @return array Success status
     */
    public function sendExamNotification(array $notificationData): array
    {
        return $this->executeWithFallback(
            function () use ($notificationData) {
                $errors = $this->validate($notificationData, [
                    'studentId' => ['required'],
                    'message' => ['required'],
                    'channels' => ['required'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'NotificationService',
                        false
                    );
                }

                $channels = $notificationData['channels'] ?? ['email'];
                $results = [];

                foreach ($channels as $channel) {
                    $result = $this->sendViaChannel(
                        $channel,
                        $notificationData['studentId'],
                        $notificationData['message']
                    );
                    $results[$channel] = $result;
                }

                $this->auditLog('SEND_NOTIFICATION', 'Notification', $notificationData['studentId'], [
                    'channels' => $channels,
                    'type' => 'exam',
                ]);

                return [
                    'success' => true,
                    'data' => $results,
                    'message' => 'Notification sent successfully',
                ];
            },
            [
                'success' => false,
                'error' => 'Unable to send notification',
                'retryable' => true,
            ],
            'sendExamNotification'
        );
    }

    /**
     * Send result notification
     *
     * @param array $notificationData
     * @return array Success status
     */
    public function sendResultNotification(array $notificationData): array
    {
        return $this->executeWithFallback(
            function () use ($notificationData) {
                $errors = $this->validate($notificationData, [
                    'studentId' => ['required'],
                    'resultId' => ['required'],
                    'channels' => ['required'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'NotificationService',
                        false
                    );
                }

                $channels = $notificationData['channels'] ?? ['email'];
                $results = [];

                foreach ($channels as $channel) {
                    $result = $this->sendViaChannel(
                        $channel,
                        $notificationData['studentId'],
                        "Your exam result is now available. Check your portal for details."
                    );
                    $results[$channel] = $result;
                }

                $this->auditLog('SEND_NOTIFICATION', 'Notification', $notificationData['studentId'], [
                    'channels' => $channels,
                    'type' => 'result',
                ]);

                return [
                    'success' => true,
                    'data' => $results,
                ];
            },
            ['success' => true, 'data' => []],
            'sendResultNotification'
        );
    }

    /**
     * Send payment notification
     *
     * @param array $notificationData
     * @return array Success status
     */
    public function sendPaymentNotification(array $notificationData): array
    {
        return $this->executeWithFallback(
            function () use ($notificationData) {
                $channels = $notificationData['channels'] ?? ['email', 'sms'];
                $results = [];

                foreach ($channels as $channel) {
                    $result = $this->sendViaChannel(
                        $channel,
                        $notificationData['studentId'],
                        $notificationData['message']
                    );
                    $results[$channel] = $result;
                }

                return [
                    'success' => true,
                    'data' => $results,
                ];
            },
            ['success' => true, 'data' => []],
            'sendPaymentNotification'
        );
    }

    /**
     * Send via specific channel
     *
     * Each channel fails independently - if SMS fails, Email continues
     *
     * @param string $channel (email, sms, whatsapp, portal)
     * @param string $studentId
     * @param string $message
     * @return array Channel result
     */
    private function sendViaChannel(string $channel, string $studentId, string $message): array
    {
        try {
            switch ($channel) {
                case 'email':
                    return $this->sendEmail($studentId, $message);
                case 'sms':
                    return $this->sendSMS($studentId, $message);
                case 'whatsapp':
                    return $this->sendWhatsApp($studentId, $message);
                case 'portal':
                    return $this->sendPortal($studentId, $message);
                default:
                    return ['success' => false, 'error' => "Unknown channel: {$channel}"];
            }
        } catch (\Exception $e) {
            // Channel error doesn't affect other channels
            $this->logger->error("Channel error: {$channel}", [
                'error' => $e->getMessage(),
                'studentId' => $studentId,
            ]);

            return [
                'success' => false,
                'channel' => $channel,
                'error' => 'Channel temporarily unavailable',
                'retryable' => true,
            ];
        }
    }

    /**
     * Send via Email
     *
     * @param string $studentId
     * @param string $message
     * @return array Result
     */
    private function sendEmail(string $studentId, string $message): array
    {
        // Mock email send - would integrate with mail service
        return [
            'success' => true,
            'channel' => 'email',
            'status' => 'sent',
        ];
    }

    /**
     * Send via SMS
     *
     * @param string $studentId
     * @param string $message
     * @return array Result
     */
    private function sendSMS(string $studentId, string $message): array
    {
        // Mock SMS send - would integrate with Twilio
        return [
            'success' => true,
            'channel' => 'sms',
            'status' => 'queued',
        ];
    }

    /**
     * Send via WhatsApp
     *
     * @param string $studentId
     * @param string $message
     * @return array Result
     */
    private function sendWhatsApp(string $studentId, string $message): array
    {
        // Mock WhatsApp send - would integrate with WhatsApp Business API
        return [
            'success' => true,
            'channel' => 'whatsapp',
            'status' => 'queued',
        ];
    }

    /**
     * Send to Portal (in-app notification)
     *
     * @param string $studentId
     * @param string $message
     * @return array Result
     */
    private function sendPortal(string $studentId, string $message): array
    {
        // Mock portal notification - would save to database
        return [
            'success' => true,
            'channel' => 'portal',
            'status' => 'stored',
        ];
    }
}
