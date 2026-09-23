<?php

use Slim\App;
use Nirvona\Controllers\{
    StudentController,
    ExamController,
    ResultController,
    AdmitCardController,
    ExamCredentialController,
    PaymentController,
    StudentResponseController,
    NotificationController,
    ProfileChangeRequestController,
    TestScheduleController
};
use Nirvona\Middleware\AuthMiddleware;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Student Routes
 *
 * "Current student" endpoints - the id comes from the verified JWT
 * (AuthMiddleware), not the URL. Previously these called controller
 * methods that read `$args['id']` from routes with no `{id}` segment
 * at all (e.g. `/api/student/profile`), so `$args['id']` was always
 * undefined - every one of these would have errored on the first
 * request. AuthMiddleware also plugs the actual security hole: the
 * middleware was defined from day one but never attached to the app,
 * so every route in this file, and every admin route, was completely
 * unauthenticated.
 *
 * Each `withId()`-wrapped route resolves the target controller from the
 * container and injects the authenticated user's id as `$args['id']`,
 * so the existing {id}-shaped controller methods (shared with the
 * admin-facing `/api/students/{id}/...` routes in api.php) work
 * unchanged for "the current student" too.
 */
return function (App $app) {
    /**
     * Build a route handler that injects the authenticated userId as
     * $args['id'] before delegating to a controller method.
     */
    $withId = function (string $controllerClass, string $method) use ($app) {
        return function (Request $request, Response $response, array $args) use ($app, $controllerClass, $method) {
            $args['id'] = $request->getAttribute('userId');
            $controller = $app->getContainer()->get($controllerClass);
            return $controller->{$method}($request, $response, $args);
        };
    };

    $group = $app->group('/api/student', function ($group) use ($withId) {
        // Student Profile
        $group->get('/profile', $withId(StudentController::class, 'getProfile'));
        $group->put('/profile', $withId(StudentController::class, 'updateProfile'));

        // Student Enrollments
        $group->get('/enrollments', $withId(StudentController::class, 'getEnrollments'));

        // Available Exams
        $group->get('/exams', [ExamController::class, 'list']);
        $group->get('/exams/{id}', [ExamController::class, 'get']);

        // Exam Results
        $group->get('/results', $withId(ResultController::class, 'getStudentResults'));
        $group->get('/results/{id}', [ResultController::class, 'get']);
        $group->get('/analytics', $withId(ResultController::class, 'getAnalytics'));

        // Admit Cards
        $group->get('/admit-cards', [AdmitCardController::class, 'listForCurrentStudent']);
    });

    $group->add(AuthMiddleware::class);

    // /api/students/me/* - aliases matching the frontend's actual REST
    // shape (src/services/student.service.ts calls "/students/me/...").
    // Previously unregistered entirely: {id}="me" either 404'd (no such
    // student) or, worse, silently matched /api/students/{id}/... with a
    // literal "me" as the id and returned empty-but-200 fallback data.
    $meGroup = $app->group('/api/students/me', function ($group) use ($withId) {
        $group->get('', $withId(StudentController::class, 'getProfile'));
        $group->put('', $withId(StudentController::class, 'updateProfile'));
        $group->put('/password', $withId(StudentController::class, 'changePassword'));
        // Combined dashboard fetch - registered before /enrollments etc.
        // (a static segment, so order doesn't actually matter here, but
        // kept near the top for visibility) so the dashboard page can do
        // one round trip instead of six.
        $group->get('/dashboard', $withId(StudentController::class, 'getDashboard'));
        $group->get('/enrollments', $withId(StudentController::class, 'getEnrollments'));
        $group->get('/payments', $withId(PaymentController::class, 'getStudentPayments'));
        // PhonePe checkout: the order is created against the authenticated
        // student (id injected from the JWT, never the client), and verify
        // also gets that id so it can refuse someone else's payment.
        $group->post('/payments/order', $withId(PaymentController::class, 'createOrder'));
        $group->post('/payments/quote', $withId(PaymentController::class, 'quote'));

        // Profile edits are by admin approval only.
        $group->post('/change-requests', $withId(ProfileChangeRequestController::class, 'create'));
        $group->get('/change-requests', $withId(ProfileChangeRequestController::class, 'listMine'));

        // Upcoming tests for the student's own active plans.
        $group->get('/test-schedule', $withId(TestScheduleController::class, 'forStudent'));
        $group->post('/payments/{paymentId}/verify', $withId(PaymentController::class, 'verify'));
        $group->get('/exams', [ExamController::class, 'list']);
        $group->get('/results', $withId(ResultController::class, 'getStudentResults'));
        $group->get('/results/latest', $withId(ResultController::class, 'getLatestForStudent'));
        $group->get('/analytics', $withId(ResultController::class, 'getAnalytics'));
        $group->get('/admit-card', $withId(AdmitCardController::class, 'getLatestForStudent'));
        $group->get(
            '/exams/{examId}/responses',
            $withId(StudentResponseController::class, 'getForStudent')
        );
        $group->get(
            '/exams/{examId}/result',
            $withId(ResultController::class, 'getForCurrentStudentExam')
        );

        // Notifications - static routes registered before the
        // {notificationId} variable one below (FastRoute rejects a
        // static route registered after a variable route that could
        // also match it - see the api.php/student.php load-order note
        // in public/index.php for the same issue at the top level).
        $group->get('/exams/{examId}/credential', $withId(ExamCredentialController::class, 'getForStudent'));
        $group->get('/admit-cards', $withId(AdmitCardController::class, 'listByStudent'));
        $group->get('/topic-performance', $withId(ResultController::class, 'getTopicPerformance'));

        $group->get('/notifications', $withId(NotificationController::class, 'listForStudent'));
        $group->get('/notifications/unread-count', $withId(NotificationController::class, 'unreadCount'));
        $group->put('/notifications/read-all', $withId(NotificationController::class, 'markAllRead'));
        $group->put(
            '/notifications/{notificationId}/read',
            $withId(NotificationController::class, 'markRead')
        );
    });

    $meGroup->add(AuthMiddleware::class);

    // Not yet built - the frontend also calls this but there's no
    // exam-agnostic credential concept to back it: ExamCredential is
    // always scoped to one exam ("/students/me/exam-credential" has no
    // exam id to look up).
};
