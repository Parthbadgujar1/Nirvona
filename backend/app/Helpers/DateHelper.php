<?php

namespace Nirvona\Helpers;

/**
 * DateHelper
 *
 * Provides date and time utilities.
 */
class DateHelper
{
    /**
     * Get current timestamp
     *
     * @return string
     */
    public static function now(): string
    {
        return date('Y-m-d H:i:s');
    }

    /**
     * Format date
     *
     * @param string $date
     * @param string $format
     * @return string
     */
    public static function format(string $date, string $format = 'Y-m-d H:i:s'): string
    {
        $dt = new \DateTime($date);
        return $dt->format($format);
    }

    /**
     * Add days to date
     *
     * @param string $date
     * @param int $days
     * @return string
     */
    public static function addDays(string $date, int $days): string
    {
        $dt = new \DateTime($date);
        $dt->modify("+{$days} days");
        return $dt->format('Y-m-d H:i:s');
    }

    /**
     * Calculate difference in days
     *
     * @param string $date1
     * @param string $date2
     * @return int
     */
    public static function daysBetween(string $date1, string $date2): int
    {
        $d1 = new \DateTime($date1);
        $d2 = new \DateTime($date2);
        return $d1->diff($d2)->days;
    }

    /**
     * Check if date is in past
     *
     * @param string $date
     * @return bool
     */
    public static function isPast(string $date): bool
    {
        return strtotime($date) < time();
    }

    /**
     * Check if date is in future
     *
     * @param string $date
     * @return bool
     */
    public static function isFuture(string $date): bool
    {
        return strtotime($date) > time();
    }

    /**
     * Format for display
     *
     * @param string $date
     * @return string
     */
    public static function toDisplay(string $date): string
    {
        $dt = new \DateTime($date);
        return $dt->format('d M Y, h:i A');
    }

    /**
     * Get human readable time difference
     *
     * @param string $date
     * @return string
     */
    public static function timeAgo(string $date): string
    {
        $dt = new \DateTime($date);
        $now = new \DateTime();
        $interval = $now->diff($dt);

        if ($interval->days > 365) {
            return ($interval->days / 365) . ' years ago';
        } elseif ($interval->days > 30) {
            return ($interval->days / 30) . ' months ago';
        } elseif ($interval->days > 0) {
            return $interval->days . ' days ago';
        } elseif ($interval->h > 0) {
            return $interval->h . ' hours ago';
        } elseif ($interval->i > 0) {
            return $interval->i . ' minutes ago';
        } else {
            return 'just now';
        }
    }
}
