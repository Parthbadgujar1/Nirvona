<?php

namespace Nirvona\Helpers;

/**
 * ValidationHelper
 *
 * Provides validation utilities.
 */
class ValidationHelper
{
    /**
     * Validate email format
     *
     * @param string $email
     * @return bool
     */
    public static function isValidEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validate mobile number (10 digits)
     *
     * @param string $mobile
     * @return bool
     */
    public static function isValidMobile(string $mobile): bool
    {
        return preg_match('/^\d{10}$/', $mobile) === 1;
    }

    /**
     * Validate UUID
     *
     * @param string $uuid
     * @return bool
     */
    public static function isValidUuid(string $uuid): bool
    {
        $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';
        return preg_match($pattern, $uuid) === 1;
    }

    /**
     * Validate date format (YYYY-MM-DD)
     *
     * @param string $date
     * @return bool
     */
    public static function isValidDate(string $date): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }

    /**
     * Validate datetime format (YYYY-MM-DD HH:MM:SS)
     *
     * @param string $datetime
     * @return bool
     */
    public static function isValidDateTime(string $datetime): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d H:i:s', $datetime);
        return $d && $d->format('Y-m-d H:i:s') === $datetime;
    }

    /**
     * Validate URL
     *
     * @param string $url
     * @return bool
     */
    public static function isValidUrl(string $url): bool
    {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }

    /**
     * Sanitize input string
     *
     * @param string $input
     * @return string
     */
    public static function sanitize(string $input): string
    {
        return trim(htmlspecialchars($input, ENT_QUOTES, 'UTF-8'));
    }

    /**
     * Validate password strength
     *
     * @param string $password
     * @return array ['valid' => bool, 'message' => string]
     */
    public static function validatePassword(string $password): array
    {
        if (strlen($password) < 8) {
            return ['valid' => false, 'message' => 'Password must be at least 8 characters'];
        }

        if (!preg_match('/[A-Z]/', $password)) {
            return ['valid' => false, 'message' => 'Password must contain uppercase letter'];
        }

        if (!preg_match('/[a-z]/', $password)) {
            return ['valid' => false, 'message' => 'Password must contain lowercase letter'];
        }

        if (!preg_match('/[0-9]/', $password)) {
            return ['valid' => false, 'message' => 'Password must contain number'];
        }

        return ['valid' => true, 'message' => 'Password is valid'];
    }
}
