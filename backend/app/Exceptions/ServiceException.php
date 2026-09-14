<?php

namespace Nirvona\Exceptions;

use Exception;

/**
 * ServiceException
 *
 * Custom exception for service layer errors.
 * Used for error isolation - services catch these and return fallback responses
 * instead of throwing them up to crash the entire application.
 */
class ServiceException extends Exception
{
    private string $service;
    private bool $retryable;

    public function __construct(
        string $message,
        string $service,
        bool $retryable = false,
        int $code = 0,
        ?Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->service = $service;
        $this->retryable = $retryable;
    }

    /**
     * Get the service name where exception occurred
     *
     * @return string
     */
    public function getService(): string
    {
        return $this->service;
    }

    /**
     * Is this operation retryable?
     *
     * @return bool
     */
    public function isRetryable(): bool
    {
        return $this->retryable;
    }
}
