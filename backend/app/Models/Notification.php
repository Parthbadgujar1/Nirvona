<?php

namespace Nirvona\Models;

/**
 * Notification Model
 *
 * One broadcast/announcement down one channel to one audience. Mirrors
 * the frontend's AppNotification type.
 */
class Notification extends BaseModel
{
    public ?string $title = null;
    public ?string $message = null;
    public ?string $type = 'general';
    public ?string $channel = null;
    public ?string $audience = null;
    public ?int $recipientCount = 0;
    public ?string $status = 'pending';

    /**
     * @return bool
     */
    public function isDelivered(): bool
    {
        return $this->status === 'delivered';
    }

    /**
     * @return bool
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }
}
