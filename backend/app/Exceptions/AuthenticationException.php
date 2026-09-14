<?php

namespace Nirvona\Exceptions;

use Exception;

/**
 * AuthenticationException
 *
 * Thrown when authentication fails.
 */
class AuthenticationException extends Exception
{
    public function __construct(string $message = "Authentication failed")
    {
        parent::__construct($message);
    }
}
