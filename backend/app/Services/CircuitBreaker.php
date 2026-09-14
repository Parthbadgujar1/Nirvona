<?php

namespace Nirvona\Services;

use Predis\Client as RedisClient;

/**
 * Circuit Breaker Pattern
 *
 * Prevents cascade failures by monitoring service health.
 * States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (recovery test)
 *
 * When a service fails repeatedly:
 * 1. CLOSED → OPEN: Stop calling the service, use fallback instead
 * 2. OPEN → HALF_OPEN: After timeout, allow one test call
 * 3. HALF_OPEN → CLOSED: If test succeeds, resume normal operation
 * 4. HALF_OPEN → OPEN: If test fails, wait longer before retrying
 */
class CircuitBreaker
{
    private const STATE_CLOSED = 'closed';
    private const STATE_OPEN = 'open';
    private const STATE_HALF_OPEN = 'half_open';

    private const FAILURE_THRESHOLD = 5;      // Open after 5 failures
    private const TIMEOUT_SECONDS = 60;        // Try recovery after 60 seconds
    private const HALF_OPEN_TIMEOUT = 30;     // Allow 30 seconds for half-open

    private RedisClient $redis;

    public function __construct(RedisClient $redis)
    {
        $this->redis = $redis;
    }

    /**
     * Execute operation with circuit breaker protection
     *
     * @param string $serviceName Name of the service
     * @param callable $callable The operation to execute
     * @param mixed $fallback Value to return if circuit is open
     * @return mixed Operation result or fallback
     */
    public function execute(string $serviceName, callable $callable, mixed $fallback = null): mixed
    {
        $state = $this->getState($serviceName);

        // If circuit is open, return fallback immediately (don't call service)
        if ($state === self::STATE_OPEN) {
            // Check if timeout has passed to allow recovery attempt
            if ($this->canAttemptRecovery($serviceName)) {
                $this->setState($serviceName, self::STATE_HALF_OPEN);
            } else {
                return $fallback ?? $this->getFallbackResponse($serviceName);
            }
        }

        try {
            $result = $callable();

            // Success! Reset the circuit
            $this->recordSuccess($serviceName);
            $this->setState($serviceName, self::STATE_CLOSED);

            return $result;
        } catch (\Exception $e) {
            // Failure! Record it
            $failureCount = $this->recordFailure($serviceName);

            // If too many failures, open the circuit
            if ($failureCount >= self::FAILURE_THRESHOLD) {
                $this->setState($serviceName, self::STATE_OPEN);
                $this->setOpenTime($serviceName);
            }

            return $fallback ?? $this->getFallbackResponse($serviceName);
        }
    }

    /**
     * Get current state of circuit for a service
     *
     * @param string $serviceName
     * @return string Current state (closed, open, half_open)
     */
    private function getState(string $serviceName): string
    {
        $state = $this->redis->get("circuit_breaker:{$serviceName}:state");
        return $state ?? self::STATE_CLOSED;
    }

    /**
     * Set circuit state
     *
     * @param string $serviceName
     * @param string $state
     * @return void
     */
    private function setState(string $serviceName, string $state): void
    {
        $this->redis->setex(
            "circuit_breaker:{$serviceName}:state",
            self::TIMEOUT_SECONDS * 2,
            $state
        );
    }

    /**
     * Record successful operation
     *
     * @param string $serviceName
     * @return void
     */
    private function recordSuccess(string $serviceName): void
    {
        // Reset failure counter on success
        $this->redis->del("circuit_breaker:{$serviceName}:failures");
        $this->redis->del("circuit_breaker:{$serviceName}:open_time");
    }

    /**
     * Record failed operation
     *
     * @param string $serviceName
     * @return int Updated failure count
     */
    private function recordFailure(string $serviceName): int
    {
        $key = "circuit_breaker:{$serviceName}:failures";
        $count = $this->redis->incr($key);
        $this->redis->expire($key, self::TIMEOUT_SECONDS);

        return $count;
    }

    /**
     * Set timestamp when circuit opened
     *
     * @param string $serviceName
     * @return void
     */
    private function setOpenTime(string $serviceName): void
    {
        $this->redis->setex(
            "circuit_breaker:{$serviceName}:open_time",
            self::TIMEOUT_SECONDS,
            time()
        );
    }

    /**
     * Check if enough time has passed to attempt recovery
     *
     * @param string $serviceName
     * @return bool
     */
    private function canAttemptRecovery(string $serviceName): bool
    {
        $openTime = $this->redis->get("circuit_breaker:{$serviceName}:open_time");

        if (!$openTime) {
            return true;
        }

        return (time() - $openTime) >= self::TIMEOUT_SECONDS;
    }

    /**
     * Get fallback response
     *
     * @param string $serviceName
     * @return array
     */
    private function getFallbackResponse(string $serviceName): array
    {
        return [
            'success' => false,
            'error' => "Service temporarily unavailable",
            'service' => $serviceName,
            'message' => 'Please try again in a few moments.',
            'retryable' => true,
        ];
    }

    /**
     * Reset circuit breaker for a service (admin use)
     *
     * @param string $serviceName
     * @return void
     */
    public function reset(string $serviceName): void
    {
        $this->redis->del("circuit_breaker:{$serviceName}:state");
        $this->redis->del("circuit_breaker:{$serviceName}:failures");
        $this->redis->del("circuit_breaker:{$serviceName}:open_time");
    }

    /**
     * Get circuit status (for monitoring)
     *
     * @param string $serviceName
     * @return array
     */
    public function getStatus(string $serviceName): array
    {
        return [
            'service' => $serviceName,
            'state' => $this->getState($serviceName),
            'failures' => $this->redis->get("circuit_breaker:{$serviceName}:failures") ?? 0,
            'openTime' => $this->redis->get("circuit_breaker:{$serviceName}:open_time"),
        ];
    }
}
