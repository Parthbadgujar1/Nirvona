<?php

namespace Nirvona\Config;

use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

/**
 * ContainerException
 *
 * Thrown by Container when an entry cannot be found or autowired.
 * Implements both PSR-11 exception interfaces so callers (and Slim's
 * CallableResolver) can catch it generically as a container problem.
 */
class ContainerException extends \RuntimeException implements
    ContainerExceptionInterface,
    NotFoundExceptionInterface
{
}
