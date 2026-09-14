<?php

namespace Nirvona\Services;

use Nirvona\Repositories\TopicRepository;
use Nirvona\Exceptions\ServiceException;

/**
 * TopicService
 *
 * Handles curriculum topic-catalogue authoring with error isolation.
 */
class TopicService extends BaseService
{
    private TopicRepository $topicRepository;

    public function __construct(
        TopicRepository $topicRepository,
        \Psr\Log\LoggerInterface $logger,
        CircuitBreaker $circuitBreaker
    ) {
        parent::__construct($logger, $circuitBreaker);
        $this->topicRepository = $topicRepository;
    }

    /**
     * List topics for a subject
     *
     * @param string $subjectId
     * @return array
     */
    public function getBySubject(string $subjectId): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->topicRepository->getBySubject($subjectId)],
            ['success' => true, 'data' => []],
            'getTopicsBySubject'
        );
    }

    /**
     * List all topics for a course
     *
     * @param string $courseSlug
     * @return array
     */
    public function getByCourse(string $courseSlug): array
    {
        return $this->executeWithFallback(
            fn() => ['success' => true, 'data' => $this->topicRepository->getByCourse($courseSlug)],
            ['success' => true, 'data' => []],
            'getTopicsByCourse'
        );
    }

    /**
     * Create a topic
     *
     * @param array $data
     * @return array
     */
    public function create(array $data): array
    {
        return $this->executeWithFallback(
            function () use ($data) {
                $errors = $this->validate($data, [
                    'subjectId' => ['required'],
                    'courseSlug' => ['required'],
                    'name' => ['required', 'string'],
                ]);

                if (!empty($errors)) {
                    throw new ServiceException(
                        "Validation failed: " . json_encode($errors),
                        'TopicService',
                        false
                    );
                }

                $topic = $this->topicRepository->create($data);
                $this->auditLog('CREATE', 'Topic', $topic['id'], ['courseSlug' => $data['courseSlug']]);

                return ['success' => true, 'data' => $topic, 'message' => 'Topic created successfully'];
            },
            null,
            'createTopic'
        );
    }

    /**
     * Update a topic
     *
     * @param string $id
     * @param array $data
     * @return array
     */
    public function update(string $id, array $data): array
    {
        return $this->executeWithFallback(
            function () use ($id, $data) {
                if (!$this->topicRepository->getById($id)) {
                    throw new ServiceException("Topic not found: {$id}", 'TopicService', false);
                }

                $this->topicRepository->update($id, $data);
                $this->auditLog('UPDATE', 'Topic', $id, ['fields' => array_keys($data)]);

                return ['success' => true, 'data' => $this->topicRepository->getById($id)];
            },
            null,
            'updateTopic'
        );
    }

    /**
     * Delete a topic
     *
     * @param string $id
     * @return array
     */
    public function delete(string $id): array
    {
        return $this->executeWithFallback(
            function () use ($id) {
                if (!$this->topicRepository->getById($id)) {
                    throw new ServiceException("Topic not found: {$id}", 'TopicService', false);
                }

                $this->topicRepository->delete($id);
                $this->auditLog('DELETE', 'Topic', $id, []);

                return ['success' => true, 'message' => 'Topic deleted successfully'];
            },
            null,
            'deleteTopic'
        );
    }
}
