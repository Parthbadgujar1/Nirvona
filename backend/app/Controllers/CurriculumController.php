<?php

namespace Nirvona\Controllers;

use Nirvona\Services\SubjectService;
use Nirvona\Services\TopicService;
use Nirvona\Services\SyllabusService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * CurriculumController
 *
 * Handles HTTP requests for course curriculum authoring: subjects,
 * topics, and syllabus units. Grouped into one controller since these
 * three are always managed together per course and each is too small
 * to warrant its own file.
 */
class CurriculumController
{
    private SubjectService $subjectService;
    private TopicService $topicService;
    private SyllabusService $syllabusService;

    public function __construct(
        SubjectService $subjectService,
        TopicService $topicService,
        SyllabusService $syllabusService
    ) {
        $this->subjectService = $subjectService;
        $this->topicService = $topicService;
        $this->syllabusService = $syllabusService;
    }

    // --- Subjects ---------------------------------------------------

    /**
     * GET /api/courses/{slug}/subjects
     */
    public function listSubjects(Request $request, Response $response, array $args): Response
    {
        $result = $this->subjectService->getByCourse($args['slug']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/courses/{slug}/subjects
     */
    public function createSubject(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $data['courseSlug'] = $args['slug'];
        $result = $this->subjectService->create($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/admin/subjects/{id}
     */
    public function updateSubject(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->subjectService->update($args['id'], $data);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/admin/subjects/{id}
     */
    public function deleteSubject(Request $request, Response $response, array $args): Response
    {
        $result = $this->subjectService->delete($args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    // --- Topics -------------------------------------------------------

    /**
     * GET /api/subjects/{subjectId}/topics
     */
    public function listTopicsBySubject(Request $request, Response $response, array $args): Response
    {
        $result = $this->topicService->getBySubject($args['subjectId']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/courses/{slug}/topics
     */
    public function listTopicsByCourse(Request $request, Response $response, array $args): Response
    {
        $result = $this->topicService->getByCourse($args['slug']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/topics
     */
    public function createTopic(Request $request, Response $response): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->topicService->create($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/admin/topics/{id}
     */
    public function updateTopic(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->topicService->update($args['id'], $data);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/admin/topics/{id}
     */
    public function deleteTopic(Request $request, Response $response, array $args): Response
    {
        $result = $this->topicService->delete($args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    // --- Syllabus -------------------------------------------------------

    /**
     * GET /api/courses/{slug}/syllabus
     */
    public function getSyllabus(Request $request, Response $response, array $args): Response
    {
        $result = $this->syllabusService->getByCourse($args['slug']);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/admin/courses/{slug}/syllabus
     */
    public function addSyllabusUnit(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $data['courseSlug'] = $args['slug'];
        $result = $this->syllabusService->addUnit($data);
        $statusCode = $result['success'] ? 201 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/admin/syllabus/{id}
     */
    public function updateSyllabusUnit(Request $request, Response $response, array $args): Response
    {
        $data = json_decode($request->getBody(), true) ?? [];
        $result = $this->syllabusService->update($args['id'], $data);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/admin/syllabus/{id}
     */
    public function deleteSyllabusUnit(Request $request, Response $response, array $args): Response
    {
        $result = $this->syllabusService->delete($args['id']);
        $statusCode = $result['success'] ? 200 : 400;
        $response->getBody()->write(json_encode($result));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
}
