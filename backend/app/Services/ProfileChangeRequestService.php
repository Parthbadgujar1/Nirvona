<?php

namespace Nirvona\Services;

use Nirvona\Repositories\ProfileChangeRequestRepository;
use Nirvona\Repositories\StudentRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * ProfileChangeRequestService
 *
 * Students cannot edit their own profile. To change their name, gender,
 * mobile number and so on they file a request; an admin approves it (the
 * change is then applied through the normal, validated profile update) or
 * rejects it with a note.
 */
class ProfileChangeRequestService extends BaseService
{
    /** Fields a student may ask to have changed. */
    public const FIELDS = [
        'fullName', 'email', 'mobile', 'dateOfBirth', 'gender', 'className',
        'school', 'city', 'state', 'address', 'guardianName', 'guardianMobile',
    ];

    private const MAX_PER_DAY = 5;

    private ProfileChangeRequestRepository $repository;
    private StudentRepository $studentRepository;
    private StudentService $studentService;

    public function __construct(
        ProfileChangeRequestRepository $repository,
        StudentRepository $studentRepository,
        StudentService $studentService,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->repository = $repository;
        $this->studentRepository = $studentRepository;
        $this->studentService = $studentService;
    }

    /**
     * @param array<string, mixed> $data { changes: {field: value}, reason?: string }
     */
    public function create(string $studentId, array $data): array
    {
        return $this->executeWithFallback(
            function () use ($studentId, $data) {
                $student = $this->studentRepository->getById($studentId);
                if (!$student) {
                    throw new ServiceException('Student not found.', 'ProfileChangeRequestService', false);
                }

                $requested = $data['changes'] ?? null;
                if (!is_array($requested) || $requested === []) {
                    throw new ServiceException('Choose at least one detail to change.', 'ProfileChangeRequestService', false);
                }

                $changes = [];
                foreach ($requested as $field => $value) {
                    if (!in_array($field, self::FIELDS, true)) {
                        throw new ServiceException('That detail cannot be changed by request.', 'ProfileChangeRequestService', false);
                    }
                    if (!is_string($value) || mb_strlen(trim($value)) > 500) {
                        throw new ServiceException('One of the new values is invalid.', 'ProfileChangeRequestService', false);
                    }
                    $value = trim($value);
                    // A request that changes nothing is dropped.
                    if ($value === trim((string) ($student[$field] ?? ''))) {
                        continue;
                    }
                    $changes[$field] = $value;
                }
                if ($changes === []) {
                    throw new ServiceException('The new details are the same as your current details.', 'ProfileChangeRequestService', false);
                }

                $reason = isset($data['reason']) && is_string($data['reason']) ? trim($data['reason']) : '';
                if (mb_strlen($reason) > 1000) {
                    throw new ServiceException('Please keep the reason under 1000 characters.', 'ProfileChangeRequestService', false);
                }

                if ($this->repository->hasPending($studentId)) {
                    throw new ServiceException(
                        'You already have a change request waiting for review. Please wait for the admin to respond.',
                        'ProfileChangeRequestService',
                        false
                    );
                }
                if ($this->repository->countSince($studentId, date('Y-m-d H:i:s', strtotime('-1 day'))) >= self::MAX_PER_DAY) {
                    throw new ServiceException('Too many requests today. Please try again tomorrow.', 'ProfileChangeRequestService', false);
                }

                // Validate exactly as the real update would (format, email
                // uniqueness, ...) so the admin is never handed a request
                // that can't be applied. Nothing is saved here.
                $check = $this->studentService->updateProfile($studentId, $changes, true);
                if (empty($check['success'])) {
                    $message = $check['error']['message'] ?? ($check['message'] ?? 'One of the new details is invalid.');
                    throw new ServiceException((string) $message, 'ProfileChangeRequestService', false);
                }

                $request = $this->repository->createRequest($studentId, $changes, $reason === '' ? null : $reason);
                $this->auditLog('CREATE', 'ProfileChangeRequest', $request['id'], ['fields' => array_keys($changes)]);

                return ['success' => true, 'data' => $request, 'message' => 'Your request has been sent to the admin.'];
            },
            null,
            'createProfileChangeRequest'
        );
    }

    public function listMine(string $studentId): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->repository->getByStudent($studentId)],
            ['success' => true, 'data' => []],
            'listMyChangeRequests'
        );
    }

    public function listForAdmin(?string $status): array
    {
        return $this->executeWithFallback(
            function () use ($status) {
                if ($status !== null && !in_array($status, ['pending', 'approved', 'rejected'], true)) {
                    $status = null;
                }
                $rows = $this->repository->listForAdmin($status);
                // Show what each requested field currently holds.
                foreach ($rows as &$row) {
                    $student = $this->studentRepository->getById($row['studentId']) ?? [];
                    $current = [];
                    foreach ((array) $row['changes'] as $field => $_) {
                        $current[$field] = $student[$field] ?? null;
                    }
                    $row['current'] = $current;
                }
                unset($row);
                return [
                    'success' => true,
                    'data' => $rows,
                    'pendingCount' => $this->repository->countPending(),
                ];
            },
            ['success' => true, 'data' => [], 'pendingCount' => 0],
            'listChangeRequestsForAdmin'
        );
    }

    public function approve(string $id, ?string $adminId, ?string $note): array
    {
        return $this->executeWithFallback(
            function () use ($id, $adminId, $note) {
                $request = $this->repository->getById($id);
                if (!$request) {
                    throw new ServiceException("Request not found: {$id}", 'ProfileChangeRequestService', false);
                }
                if ($request['status'] !== 'pending') {
                    throw new ServiceException('This request has already been handled.', 'ProfileChangeRequestService', false);
                }

                $applied = $this->studentService->updateProfile($request['studentId'], (array) $request['changes']);
                if (empty($applied['success'])) {
                    $message = $applied['error']['message'] ?? ($applied['message'] ?? 'The change could not be applied.');
                    throw new ServiceException((string) $message, 'ProfileChangeRequestService', false);
                }

                $this->repository->resolve($id, 'approved', $this->cleanNote($note), $adminId);
                $this->auditLog('APPROVE', 'ProfileChangeRequest', $id, ['studentId' => $request['studentId']]);

                return ['success' => true, 'message' => 'Change approved and applied.'];
            },
            null,
            'approveChangeRequest'
        );
    }

    public function reject(string $id, ?string $adminId, ?string $note): array
    {
        return $this->executeWithFallback(
            function () use ($id, $adminId, $note) {
                $request = $this->repository->getById($id);
                if (!$request) {
                    throw new ServiceException("Request not found: {$id}", 'ProfileChangeRequestService', false);
                }
                if (!$this->repository->resolve($id, 'rejected', $this->cleanNote($note), $adminId)) {
                    throw new ServiceException('This request has already been handled.', 'ProfileChangeRequestService', false);
                }
                $this->auditLog('REJECT', 'ProfileChangeRequest', $id, ['studentId' => $request['studentId']]);
                return ['success' => true, 'message' => 'Request rejected.'];
            },
            null,
            'rejectChangeRequest'
        );
    }

    private function cleanNote(?string $note): ?string
    {
        $note = trim((string) $note);
        if (mb_strlen($note) > 1000) {
            throw new ServiceException('Please keep the note under 1000 characters.', 'ProfileChangeRequestService', false);
        }
        return $note === '' ? null : $note;
    }
}
