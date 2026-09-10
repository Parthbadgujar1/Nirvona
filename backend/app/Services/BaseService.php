<?php

namespace Nirvona\Services;

use Nirvona\Exceptions\ServiceException;
use Psr\Log\LoggerInterface;

/**
 * BaseService - Error Isolation & Resilience
 *
 * Provides common service functionality with error handling
 * so that one service failure doesn't crash the entire system.
 *
 * Each service must extend this to ensure:
 * - Exceptions are caught and logged
 * - Fallback responses are returned
 * - System continues functioning even if a service fails
 */
abstract class BaseService
{
    protected LoggerInterface $logger;
    protected CircuitBreaker $circuitBreaker;

    public function __construct(LoggerInterface $logger, CircuitBreaker $circuitBreaker)
    {
        $this->logger = $logger;
        $this->circuitBreaker = $circuitBreaker;
    }

    /**
     * Execute callable with error handling and fallback
     *
     * @param callable $callable The operation to execute
     * @param mixed $fallback Fallback value if operation fails
     * @param string $operation Operation name for logging
     * @return mixed Result or fallback value
     */
    protected function executeWithFallback(
        callable $callable,
        mixed $fallback = null,
        string $operation = 'Unknown Operation'
    ): mixed {
        try {
            return $callable();
        } catch (ServiceException $e) {
            // Log service-specific exception
            $this->logger->error("Service Exception in {$operation}", [
                'message' => $e->getMessage(),
                'service' => $e->getService(),
                'retryable' => $e->isRetryable(),
                'code' => $e->getCode(),
            ]);

            // Return fallback instead of throwing (error isolation)
            return $fallback ?? $this->getDefaultFallback($operation);
        } catch (\Exception $e) {
            // Log unexpected exception
            $this->logger->critical("Unexpected Exception in {$operation}", [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return safe fallback to prevent cascade failure
            return $fallback ?? $this->getDefaultFallback($operation);
        }
    }

    /**
     * Execute with circuit breaker pattern
     *
     * Prevents repeated calls to failing services.
     * Circuit states: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing)
     *
     * @param string $serviceName Name of the service being called
     * @param callable $callable The operation to execute
     * @param mixed $fallback Fallback value if circuit is open
     * @return mixed Result or fallback value
     */
    protected function executeWithCircuitBreaker(
        string $serviceName,
        callable $callable,
        mixed $fallback = null
    ): mixed {
        return $this->circuitBreaker->execute($serviceName, $callable, $fallback);
    }

    /**
     * Get default fallback response
     *
     * @param string $operation Operation name
     * @return array Standard fallback response
     */
    protected function getDefaultFallback(string $operation): array
    {
        return [
            'success' => false,
            'error' => "Failed to complete: {$operation}",
            'message' => 'Service temporarily unavailable. Please try again later.',
            'timestamp' => date('Y-m-d H:i:s'),
            'retryable' => true,
        ];
    }

    /**
     * Validate input data
     *
     * @param array $data Data to validate
     * @param array $rules Validation rules
     * @return array Validation errors (empty if valid)
     */
    protected function validate(array $data, array $rules): array
    {
        $errors = [];
        foreach ($rules as $field => $fieldRules) {
            foreach ($fieldRules as $rule) {
                $error = $this->validateField($data[$field] ?? null, $field, $rule);
                if ($error) {
                    $errors[$field][] = $error;
                }
            }
        }
        return $errors;
    }

    /**
     * Validate single field
     *
     * @param mixed $value Field value
     * @param string $field Field name
     * @param string $rule Validation rule
     * @return ?string Error message or null
     */
    private function validateField(mixed $value, string $field, string $rule): ?string
    {
        return match ($rule) {
            'required' => empty($value) ? "{$field} is required" : null,
            'email' => (!filter_var($value, FILTER_VALIDATE_EMAIL)) ? "{$field} must be valid email" : null,
            'numeric' => (!is_numeric($value)) ? "{$field} must be numeric" : null,
            'string' => (!is_string($value)) ? "{$field} must be string" : null,
            default => null,
        };
    }

    /**
     * Log operation for audit trail
     *
     * @param string $action Action performed
     * @param string $entity Entity type
     * @param string|int $entityId Entity ID
     * @param array $details Additional details
     * @return void
     */
    protected function auditLog(
        string $action,
        string $entity,
        string|int $entityId,
        array $details = []
    ): void {
        $this->logger->info("Audit Log", [
            'action' => $action,
            'entity' => $entity,
            'entityId' => $entityId,
            'timestamp' => date('Y-m-d H:i:s'),
            'details' => $details,
        ]);
    }
}
