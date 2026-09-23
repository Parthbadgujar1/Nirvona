<?php

use Slim\App;
use Nirvona\Controllers\{
    StudentController,
    PaymentController,
    CourseController,
    PackageController,
    AnswerKeyController,
    StudentResponseController,
    CurriculumController,
    SiteSettingsController,
    TestScheduleController
};
use Nirvona\Middleware\AuthMiddleware;
use Nirvona\Middleware\PublicCacheMiddleware;

/**
 * API Routes
 *
 * ONLY genuinely public endpoints live here (health, sign-up, the course
 * and package catalogue, the syllabus, and the PhonePe webhook).
 *
 * Everything that returns or changes a particular person's data is under
 * an authenticated group whose student id comes from the verified JWT,
 * never from the URL:
 *   - routes/student.php  -> /api/students/me/... and /api/student/...
 *   - routes/admin.php    -> /api/admin/...  (AdminMiddleware)
 *
 * History: this file used to expose /api/students/{id}/(payments|results|
 * enrollments|analytics|admit-cards|responses|credential) and
 * /api/payments/{id}, /api/results/{id} with no authentication - changing
 * the id in the URL returned another student's data - plus unauthenticated
 * POST /api/exams, /api/results and /api/enrollments (free enrolment, forged
 * results). None had a caller (the app uses the /me routes and the admin
 * routes), so they were removed rather than patched.
 */
return function (App $app) {
    // Health check
    $app->get('/api/health', function ($request, $response) {
        $response->getBody()->write(json_encode(['status' => 'ok']));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // Sign-up (rate limited + validated in the service)
    $app->post('/api/students/register', [StudentController::class, 'register']);

    // PhonePe webhook (authenticated by its Authorization header, not a JWT).
    $app->post('/api/payments/phonepe/callback', [PaymentController::class, 'phonePeCallback']);

    // Public catalogue + curriculum (only active courses/packages are returned
    // publicly). Identical for every visitor, so browsers/proxies may cache it
    // briefly (see PublicCacheMiddleware).
    $catalogue = $app->group('/api', function ($group) {
        $group->get('/courses', [CourseController::class, 'list']);
        $group->get('/courses/{slug}', [CourseController::class, 'get']);
        $group->get('/courses/{slug}/packages', [CourseController::class, 'getPackages']);
        $group->get('/packages', [PackageController::class, 'list']);
        $group->get('/packages/{id}', [PackageController::class, 'get']);
        // Contact details (address, phone, contact person...) the admin edits in Settings.
        $group->get('/site-settings', [SiteSettingsController::class, 'get']);
        // Upcoming tests only - already-conducted tests and the source calendar dates are never exposed.
        $group->get('/courses/{slug}/schedule', [TestScheduleController::class, 'forCourse']);

        $group->get('/courses/{slug}/subjects', [CurriculumController::class, 'listSubjects']);
        $group->get('/courses/{slug}/topics', [CurriculumController::class, 'listTopicsByCourse']);
        $group->get('/subjects/{subjectId}/topics', [CurriculumController::class, 'listTopicsBySubject']);
        $group->get('/courses/{slug}/syllabus', [CurriculumController::class, 'getSyllabus']);
    });
    $catalogue->add(new PublicCacheMiddleware());

    // Signed-in users only. The published answer key and the response
    // upload; the upload's studentId is taken from the JWT, not the body.
    $authed = $app->group('/api/exams/{examId}', function ($group) {
        $group->get('/answer-key', [AnswerKeyController::class, 'get']);
        $group->post('/responses', [StudentResponseController::class, 'upload']);
    });
    $authed->add(AuthMiddleware::class);
};
