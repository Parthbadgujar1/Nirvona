<?php

namespace Nirvona\Config;

use Psr\Container\ContainerInterface;
use ReflectionClass;
use ReflectionNamedType;

/**
 * Container
 *
 * Minimal PSR-11 dependency injection container with constructor
 * autowiring. This is what wires Controllers -> Services -> Repositories
 * together so Slim can instantiate route handlers.
 *
 * Without this, `AppFactory::create()` has no container and Slim's
 * CallableResolver can only `new $class()` with zero arguments - every
 * Controller in this app requires constructor dependencies, so every
 * route would fatal with an ArgumentCountError.
 *
 * Usage:
 *   $container = new Container();
 *   $container->set(PDO::class, Database::getConnection());
 *   $container->set(RedisClient::class, Cache::getRedis());
 *   $container->set(LoggerInterface::class, $logger);
 *   AppFactory::setContainer($container);
 *
 * Anything not explicitly registered (Repositories, Services,
 * Controllers) is resolved on demand by reflecting its constructor and
 * recursively resolving each typed parameter, then cached as a
 * singleton for the lifetime of the request.
 */
class Container implements ContainerInterface
{
    /** @var array<string, mixed> Registered/resolved singletons keyed by class or interface name */
    private array $instances = [];

    /** @var array<string, true> Guards against circular constructor dependencies */
    private array $resolving = [];

    /**
     * Register a concrete value (or factory result) under an id.
     * Use this for things that can't be autowired: PDO, Redis clients,
     * loggers bound to an interface, scalars, etc.
     *
     * @param string $id Class name, interface name, or arbitrary key
     * @param mixed $value
     * @return void
     */
    public function set(string $id, mixed $value): void
    {
        $this->instances[$id] = $value;
    }

    /**
     * @param string $id
     * @return bool
     */
    public function has(string $id): bool
    {
        return array_key_exists($id, $this->instances) || class_exists($id);
    }

    /**
     * @param string $id
     * @return mixed
     * @throws ContainerException If the entry can't be found or autowired
     */
    public function get(string $id): mixed
    {
        if (array_key_exists($id, $this->instances)) {
            return $this->instances[$id];
        }

        if (!class_exists($id)) {
            throw new ContainerException("No container entry or class found for '{$id}'");
        }

        $instance = $this->autowire($id);
        $this->instances[$id] = $instance;
        return $instance;
    }

    /**
     * Instantiate a class by reflecting its constructor and resolving
     * each typed parameter recursively (built-in scalar types fall back
     * to their default value, if any).
     *
     * @param string $class
     * @return object
     * @throws ContainerException
     */
    private function autowire(string $class): object
    {
        if (isset($this->resolving[$class])) {
            throw new ContainerException(
                "Circular dependency detected while resolving '{$class}'"
            );
        }

        $reflection = new ReflectionClass($class);

        if (!$reflection->isInstantiable()) {
            throw new ContainerException("Class '{$class}' is not instantiable");
        }

        $constructor = $reflection->getConstructor();
        if ($constructor === null) {
            return $reflection->newInstance();
        }

        $this->resolving[$class] = true;

        try {
            $args = [];
            foreach ($constructor->getParameters() as $param) {
                $type = $param->getType();

                if ($type instanceof ReflectionNamedType && !$type->isBuiltin()) {
                    $args[] = $this->get($type->getName());
                    continue;
                }

                if ($param->isDefaultValueAvailable()) {
                    $args[] = $param->getDefaultValue();
                    continue;
                }

                if ($param->allowsNull()) {
                    $args[] = null;
                    continue;
                }

                throw new ContainerException(
                    "Cannot autowire '\${$param->getName()}' of '{$class}': " .
                    "no class type-hint, default value, or nullable type"
                );
            }

            return $reflection->newInstanceArgs($args);
        } finally {
            unset($this->resolving[$class]);
        }
    }
}
