<?php

namespace Nirvona\Services;

use Nirvona\Exceptions\ServiceException;

/**
 * NotificationService
 *
 * Handles sending notifications (SMS, Email, WhatsApp) with error isolation.
 * If one channel fails, others continue operating.
 */
class NotificationService extends BaseService
{
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
