<?php

namespace Nirvona\Services;

use Nirvona\Repositories\SiteSettingsRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * SiteSettingsService
 *
 * Admin-editable organisation details shown on the public site (footer,
 * contact page), the student support page and payment receipts. Only the
 * whitelisted keys below can be stored, each with its own validation.
 */
class SiteSettingsService extends BaseService
{
    /** key => [label, max length, required, kind] */
    private const FIELDS = [
        'orgName' => ['Organisation name', 120, true, 'text'],
        'gstin' => ['GSTIN', 15, false, 'gstin'],
        'address' => ['Address', 500, true, 'text'],
        'contactPersonName' => ['Contact person name', 100, false, 'text'],
        'phone' => ['Phone number', 20, true, 'phone'],
        'whatsapp' => ['WhatsApp number', 20, false, 'phone'],
        'email' => ['Email address', 120, true, 'email'],
    ];

    private SiteSettingsRepository $repository;

    public function __construct(
        SiteSettingsRepository $repository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->repository = $repository;
    }

    /**
     * Every setting, with a key present even if a row is missing.
     *
     * @return array<string, string>
     */
    private function current(): array
    {
        $stored = $this->repository->allSettings();
        $out = [];
        foreach (array_keys(self::FIELDS) as $key) {
            $out[$key] = (string) ($stored[$key] ?? '');
        }
        return $out;
    }

    public function get(): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->current()],
            ['success' => false, 'error' => 'Unable to load settings'],
            'getSiteSettings'
        );
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $clean = [];
                $errors = [];
                foreach (self::FIELDS as $key => [$label, $max, $required, $kind]) {
                    if (!array_key_exists($key, $data)) {
                        continue;
                    }
                    if (!is_string($data[$key])) {
                        $errors[] = "{$label} is invalid.";
                        continue;
                    }
                    // Collapse stray control characters; keep newlines in the address.
                    $value = trim(preg_replace('/[^\P{C}\n]/u', '', $data[$key]) ?? '');
                    if ($kind !== 'text' || $key !== 'address') {
                        $value = trim(preg_replace('/\s+/', ' ', $value) ?? '');
                    }
                    if ($required && $value === '') {
                        $errors[] = "{$label} is required.";
                        continue;
                    }
                    if (mb_strlen($value) > $max) {
                        $errors[] = "{$label} must be at most {$max} characters.";
                        continue;
                    }
                    if ($value !== '') {
                        if ($kind === 'phone' && !preg_match('/^\+?[0-9][0-9\s()-]{6,18}[0-9]$/', $value)) {
                            $errors[] = "Enter a valid {$label}.";
                            continue;
                        }
                        if ($kind === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                            $errors[] = 'Enter a valid email address.';
                            continue;
                        }
                        if ($kind === 'gstin') {
                            $value = strtoupper($value);
                            if (!preg_match('/^[0-9]{2}[A-Z0-9]{10}[0-9A-Z]{3}$/', $value)) {
                                $errors[] = 'Enter a valid 15-character GSTIN (or leave it blank).';
                                continue;
                            }
                        }
                    }
                    $clean[$key] = $value;
                }

                if (!empty($errors)) {
                    throw new ServiceException(implode(' ', $errors), 'SiteSettingsService', false);
                }

                if (!empty($clean)) {
                    $this->repository->setMany($clean);
                    $this->auditLog('UPDATE', 'SiteSettings', 'site', ['fields' => array_keys($clean)]);
                }

                return ['success' => true, 'message' => 'Settings saved', 'data' => $this->current()];
            },
            null,
            'updateSiteSettings'
        );
    }
}
