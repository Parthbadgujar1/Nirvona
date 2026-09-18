<?php

use Slim\App;
use Nirvona\Controllers\{
    StudentController,
    ExamController,
    PaymentController,
    ResultController,
    CourseController,
    PackageController,
    EnrollmentController,
    ExamCredentialController,
    AnswerKeyController,
    StudentResponseController,
    AdmitCardController,
    CurriculumController
};
use Nirvona\Middleware\AuthMiddleware;

/**
 * API Routes
 *
 * Core API endpoints for students, exams, payments, results, the
 * course catalogue, and enrollments.
 */
return function (App $app) {
    // Health check
    $app->get('/api/health', function ($request, $response) {
        $response->getBody()->write(json_encode(['status' => 'ok']));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // Student Routes
    $app->post('/api/students/register', [StudentController::class, 'register']);
    // GET/PUT /api/students/{id} were registered here with no auth at
    // all - anyone could read any student's profile (email, mobile,
    // address, guardian details) or overwrite it by guessing/knowing an
    // id. Nothing used them: the student portal talks to the
    // authenticated /api/students/me (routes/student.php) and the admin
    // panel to /api/admin/students/{id}. Removed rather than wrapped in
    // auth since there's no caller to serve.
    $app->get('/api/students/{id}/enrollments', [StudentController::class, 'getEnrollments']);

    // Exam Routes
    $app->get('/api/exams', [ExamController::class, 'list']);
    $app->post('/api/exams', [ExamController::class, 'create']);
    $app->get('/api/exams/{id}', [ExamController::class, 'get']);
    $app->get('/api/exams/{id}/stats', [ExamController::class, 'getStats']);

    // Payment Routes (order creation + verification live under the
    // authenticated /api/students/me/payments/* group in student.php -
    // the amount charged has to be derived from the verified JWT's
    // studentId, not a client-supplied one)
    $app->get('/api/payments/{id}', [PaymentController::class, 'get']);
    $app->get('/api/students/{id}/payments', [PaymentController::class, 'getStudentPayments']);

    // Result Routes
    $app->get('/api/results/{id}', [ResultController::class, 'get']);
    $app->get('/api/students/{id}/results', [ResultController::class, 'getStudentResults']);
    $app->get('/api/exams/{examId}/leaderboard', [ResultController::class, 'getLeaderboard']);
    $app->get('/api/students/{id}/analytics', [ResultController::class, 'getAnalytics']);
    $app->post('/api/results', [ResultController::class, 'create']);

    // Course Catalogue Routes
    $app->get('/api/courses', [CourseController::class, 'list']);
    $app->get('/api/courses/{slug}', [CourseController::class, 'get']);
    $app->get('/api/courses/{slug}/packages', [CourseController::class, 'getPackages']);
    // Static /api/packages must be registered before the /api/packages/{id}
    // variable route below it - FastRoute rejects a static route defined
    // after a variable one that could also match it.
    $app->get('/api/packages', [PackageController::class, 'list']);
    $app->get('/api/packages/{id}', [PackageController::class, 'get']);

    // Curriculum Routes (public reads)
    $app->get('/api/courses/{slug}/subjects', [CurriculumController::class, 'listSubjects']);
    $app->get('/api/courses/{slug}/topics', [CurriculumController::class, 'listTopicsByCourse']);
    $app->get('/api/subjects/{subjectId}/topics', [CurriculumController::class, 'listTopicsBySubject']);
    $app->get('/api/courses/{slug}/syllabus', [CurriculumController::class, 'getSyllabus']);

    // Enrollment Routes
    $app->post('/api/enrollments', [EnrollmentController::class, 'create']);

    // Exam Credential Routes (student-facing lookup)
    $app->get('/api/students/{id}/exams/{examId}/credential', [ExamCredentialController::class, 'getForStudent']);

    // Admit Card Routes (student-facing lookup)
    $app->get('/api/students/{id}/admit-cards', [AdmitCardController::class, 'listByStudent']);

    // Answer Key Routes (student-facing, published only)
    $app->get('/api/exams/{examId}/answer-key', [AnswerKeyController::class, 'get']);

    // Student Response Routes
    $responseUploadGroup = $app->group('/api/exams/{examId}/responses', function ($group) {
        $group->post('', [StudentResponseController::class, 'upload']);
    });
    $responseUploadGroup->add(AuthMiddleware::class);

    $app->get('/api/students/{id}/exams/{examId}/responses', [StudentResponseController::class, 'getForStudent']);

    // Topic Performance (student-facing)
    $app->get('/api/students/{id}/topic-performance', [ResultController::class, 'getTopicPerformance']);
};
