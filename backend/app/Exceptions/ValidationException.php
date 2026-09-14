<?php

namespace Nirvona\Exceptions;

use Exception;

/**
 * ValidationException
 *
 * Thrown when request data fails validation.
 */
class ValidationException extends Exception
{
    private array $errors;

    public function __construct(string $message, array $errors = [])
    {
        parent::__construct($message);
        $this->errors = $errors;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
