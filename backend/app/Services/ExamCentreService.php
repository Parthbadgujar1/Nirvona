<?php

namespace Nirvona\Services;

use Nirvona\Repositories\ExamCentreRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * ExamCentreService
 *
 * Handles exam centre management with error isolation.
 */
class ExamCentreService extends BaseService
{
    private ExamCentreRepository $examCentreRepository;

    public function __construct(
        ExamCentreRepository $examCentreRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->examCentreRepository = $examCentreRepository;
    }

    /**
     * List active exam centres
     *
     * @return array
     */
    public function list(): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->examCentreRepository->getActive()],
            ['success' => true, 'data' => []],
            'listExamCentres'
        );
    }

    /**
     * Get a centre by ID
     *
     * @param string $id
     * @return array
     */
    public function get(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                $centre = $this->examCentreRepository->getById($id);

                if (!$centre) {
                    throw new ServiceException("Exam centre not found: {$id}", 'ExamCentreService', false);
                }

                return ['success' => true, 'data' => $centre];
            },
            ['success' => false, 'error' => 'Unable to fetch exam centre'],
            'getExamCentre'
        );
    }

    /**
     * Create an exam centre
     *
     * @param array $data
     * @return array
     */
    public function create(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $errors = $this->validate($data, [
                    'name' => ['required', 'string'],
                    'code' => ['required', 'string'],
                    'city' => ['required'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'ExamCentreService',
                        false
                    );
                }

                if ($this->examCentreRepository->findByCode($data['code'])) {
                    throw new ServiceException(
                        "Centre code already in use: {$data['code']}",
                        'ExamCentreService',
                        false
                    );
                }

                $centre = $this->examCentreRepository->create($data);

                $this->auditLog('CREATE', 'ExamCentre', $centre['id'], ['code' => $data['code']]);

                return ['success' => true, 'data' => $centre, 'message' => 'Exam centre created successfully'];
            },
            null,
            'createExamCentre'
        );
    }

    /**
     * Update an exam centre
     *
     * @param string $id
     * @param array $data
     * @return array
     */
    public function update(string $id, array $data): array
    {
        return $this->executeWithFallback(
            function () use ($id, $data) {
                if (!$this->examCentreRepository->getById($id)) {
                    throw new ServiceException("Exam centre not found: {$id}", 'ExamCentreService', false);
                }

                // Only re-check the code for a collision if it's actually
                // changing - findByCode has no "excluding this id" clause,
                // so re-saving a centre without touching its own code would
                // otherwise find itself and reject the update.
                if (!empty($data['code'])) {
                    $existing = $this->examCentreRepository->findByCode($data['code']);
                    if ($existing && $existing['id'] !== $id) {
                        throw new ServiceException(
                            "Centre code already in use: {$data['code']}",
                            'ExamCentreService',
                            false
                        );
                    }
                }

                $this->examCentreRepository->update($id, $data);
                $this->auditLog('UPDATE', 'ExamCentre', $id, ['fields' => array_keys($data)]);

                return [
                    'success' => true,
                    'data' => $this->examCentreRepository->getById($id),
                    'message' => 'Exam centre updated successfully',
                ];
            },
            null,
            'updateExamCentre'
        );
    }

    /**
     * Delete an exam centre
     *
     * Any exam already assigned to this centre keeps running -
     * exams.centreId is ON DELETE SET NULL (021_add_foreign_key_constraints),
     * not restricted, so this never fails with a foreign key violation.
     *
     * @param string $id
     * @return array
     */
    public function delete(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                if (!$this->examCentreRepository->getById($id)) {
                    throw new ServiceException("Exam centre not found: {$id}", 'ExamCentreService', false);
                }

                $this->examCentreRepository->delete($id);
                $this->auditLog('DELETE', 'ExamCentre', $id, []);

                return ['success' => true, 'message' => 'Exam centre deleted successfully'];
            },
            null,
            'deleteExamCentre'
        );
    }
}
