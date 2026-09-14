<?php

namespace Nirvona\Services;

use Nirvona\Repositories\SubjectRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * SubjectService
 *
 * Handles course-subject catalogue authoring with error isolation.
 */
class SubjectService extends BaseService
{
    private SubjectRepository $subjectRepository;

    public function __construct(
        SubjectRepository $subjectRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->subjectRepository = $subjectRepository;
    }

    /**
     * List subjects for a course
     *
     * @param string $courseSlug
     * @return array
     */
    public function getByCourse(string $courseSlug): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->subjectRepository->getByCourse($courseSlug)],
            ['success' => true, 'data' => []],
            'getSubjectsByCourse'
        );
    }

    /**
     * Create a subject under a course
     *
     * @param array $data
     * @return array
     */
    public function create(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $errors = $this->validate($data, [
                    'courseSlug' => ['required'],
                    'code' => ['required', 'string'],
                    'name' => ['required', 'string'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'SubjectService',
                        false
                    );
                }

                if ($this->subjectRepository->findByCode($data['courseSlug'], $data['code'])) {
                    throw new ServiceException(
                        "Subject code already exists for this course: {$data['code']}",
                        'SubjectService',
                        false
                    );
                }

                $subject = $this->subjectRepository->create($data);
                $this->auditLog('CREATE', 'Subject', $subject['id'], ['courseSlug' => $data['courseSlug']]);

                return ['success' => true, 'data' => $subject, 'message' => 'Subject created successfully'];
            },
            null,
            'createSubject'
        );
    }

    /**
     * Update a subject
     *
     * @param string $id
     * @param array $data
     * @return array
     */
    public function update(string $id, array $data): array
    {
        return $this->executeWithFallback(
            function () use ($id, $data) {
                if (!$this->subjectRepository->getById($id)) {
                    throw new ServiceException("Subject not found: {$id}", 'SubjectService', false);
                }

                $this->subjectRepository->update($id, $data);
                $this->auditLog('UPDATE', 'Subject', $id, ['fields' => array_keys($data)]);

                return ['success' => true, 'data' => $this->subjectRepository->getById($id)];
            },
            null,
            'updateSubject'
        );
    }

    /**
     * Delete a subject
     *
     * @param string $id
     * @return array
     */
    public function delete(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                if (!$this->subjectRepository->getById($id)) {
                    throw new ServiceException("Subject not found: {$id}", 'SubjectService', false);
                }

                $this->subjectRepository->delete($id);
                $this->auditLog('DELETE', 'Subject', $id, []);

                return ['success' => true, 'message' => 'Subject deleted successfully'];
            },
            null,
            'deleteSubject'
        );
    }
}
