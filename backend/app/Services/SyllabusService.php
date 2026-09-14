<?php

namespace Nirvona\Services;

use Nirvona\Repositories\SyllabusRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * SyllabusService
 *
 * Handles course syllabus authoring with error isolation.
 */
class SyllabusService extends BaseService
{
    private SyllabusRepository $syllabusRepository;

    public function __construct(
        SyllabusRepository $syllabusRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->syllabusRepository = $syllabusRepository;
    }

    /**
     * Get the full syllabus for a course
     *
     * @param string $courseSlug
     * @return array
     */
    public function getByCourse(string $courseSlug): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->syllabusRepository->getByCourse($courseSlug)],
            ['success' => true, 'data' => []],
            'getSyllabusByCourse'
        );
    }

    /**
     * Add a syllabus unit to a course
     *
     * @param array $data courseSlug, subject, unitTitle, topics[], subjectId?, orderIndex?
     * @return array
     */
    public function addUnit(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $errors = $this->validate($data, [
                    'courseSlug' => ['required'],
                    'subject' => ['required', 'string'],
                    'unitTitle' => ['required', 'string'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'SyllabusService',
                        false
                    );
                }

                $data['topics'] = $data['topics'] ?? [];
                $unit = $this->syllabusRepository->create($data);

                $this->auditLog('CREATE', 'SyllabusUnit', $unit['id'], ['courseSlug' => $data['courseSlug']]);

                return ['success' => true, 'data' => $unit, 'message' => 'Syllabus unit added successfully'];
            },
            null,
            'addSyllabusUnit'
        );
    }

    /**
     * Update a syllabus unit
     *
     * @param string $id
     * @param array $data
     * @return array
     */
    public function update(string $id, array $data): array
    {
        return $this->executeWithFallback(
            function () use ($id, $data) {
                if (!$this->syllabusRepository->getById($id)) {
                    throw new ServiceException("Syllabus unit not found: {$id}", 'SyllabusService', false);
                }

                if (isset($data['topics']) && is_array($data['topics'])) {
                    $data['topics'] = json_encode($data['topics']);
                }

                $this->syllabusRepository->update($id, $data);
                $this->auditLog('UPDATE', 'SyllabusUnit', $id, ['fields' => array_keys($data)]);

                return ['success' => true, 'data' => $this->syllabusRepository->getById($id)];
            },
            null,
            'updateSyllabusUnit'
        );
    }

    /**
     * Delete a syllabus unit
     *
     * @param string $id
     * @return array
     */
    public function delete(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                if (!$this->syllabusRepository->getById($id)) {
                    throw new ServiceException("Syllabus unit not found: {$id}", 'SyllabusService', false);
                }

                $this->syllabusRepository->delete($id);
                $this->auditLog('DELETE', 'SyllabusUnit', $id, []);

                return ['success' => true, 'message' => 'Syllabus unit deleted successfully'];
            },
            null,
            'deleteSyllabusUnit'
        );
    }
}
