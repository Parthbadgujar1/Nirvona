<?php

namespace Nirvona\Helpers;

/**
 * ResponseHelper
 *
 * Standardizes API response formatting.
 */
class ResponseHelper
{
    /**
     * Build success response
     *
     * @param mixed $data
     * @param string $message
     * @param array $meta
     * @return array
     */
    public static function success(mixed $data = null, string $message = '', array $meta = []): array
    {
        return [
            'success' => true,
            'data' => $data,
            'message' => $message,
            'meta' => array_merge([
                'timestamp' => date('Y-m-d H:i:s'),
                'requestId' => self::generateRequestId(),
            ], $meta),
        ];
    }

    /**
     * Build error response
     *
     * @param string $error
     * @param string $code
     * @param bool $retryable
     * @return array
     */
    public static function error(string $error, string $code = 'ERROR', bool $retryable = false): array
    {
        return [
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $error,
                'retryable' => $retryable,
            ],
            'meta' => [
                'timestamp' => date('Y-m-d H:i:s'),
                'requestId' => self::generateRequestId(),
            ],
        ];
    }

    /**
     * Build validation error response
     *
     * @param array $errors
     * @return array
     */
    public static function validationError(array $errors): array
    {
        return [
            'success' => false,
            'error' => [
                'code' => 'VALIDATION_ERROR',
                'message' => 'Validation failed',
                'details' => $errors,
            ],
            'meta' => [
                'timestamp' => date('Y-m-d H:i:s'),
                'requestId' => self::generateRequestId(),
            ],
        ];
    }

    /**
     * Generate unique request ID
     *
     * @return string
     */
    private static function generateRequestId(): string
    {
        return 'req_' . bin2hex(random_bytes(8));
    }

    /**
     * Paginated response
     *
     * @param array $data
     * @param int $total
     * @param int $page
     * @param int $pageSize
     * @param string $message
     * @return array
     */
    public static function paginated(
        array $data,
        int $total,
        int $page = 1,
        int $pageSize = 20,
        string $message = ''
    ): array {
        return self::success($data, $message, [
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => ceil($total / $pageSize),
        ]);
    }
}
