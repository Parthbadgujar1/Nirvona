<?php

use Slim\App;
use Nirvona\Controllers\{
    AdminController,
    CourseController,
    PackageController,
    ExamCentreController,
    ExamCandidateController,
    AdmitCardController,
    ExamCredentialController,
    AnswerKeyController,
    StudentResponseController,
    EnrollmentController,
    ResultController,
    QuestionController,
    CurriculumController,
    ScoringController,
    NotificationController
};
use Nirvona\Middleware\AdminMiddleware;

/**
 * Admin Routes
 *
 * Admin dashboard and management endpoints. Wrapped in AdminMiddleware,
 * which requires a verified JWT with role=admin - previously this was
 * only a docblock claim ("Requires admin authentication"); nothing
 * actually enforced it, and there was no `admins` table to check
 * against in the first place.
 */
return function (App $app) {
    $group = $app->group('/api/admin', function ($group) {
        // Admin Dashboard
        $group->get('/dashboard', [AdminController::class, 'getDashboard']);
        $group->get('/analytics/revenue-trend', [AdminController::class, 'getRevenueTrend']);
        $group->get('/analytics/registration-trend', [AdminController::class, 'getRegistrationTrend']);
        $group->get('/analytics/participation-trend', [AdminController::class, 'getParticipationTrend']);
        $group->get('/analytics/course-split', [AdminController::class, 'getCourseSplit']);
        $group->get('/activity', [AdminController::class, 'getActivity']);

        // Notifications
        $group->get('/notifications', [NotificationController::class, 'listForAdmin']);
        $group->post('/notifications', [NotificationController::class, 'create']);
        $group->post('/notifications/{id}/retry', [NotificationController::class, 'retry']);
        $group->delete('/notifications/{id}', [NotificationController::class, 'delete']);

        // Catalogue Management: Courses
        $group->get('/courses', [CourseController::class, 'listForAdmin']);
        $group->post('/courses', [CourseController::class, 'create']);
        $group->put('/courses/{slug}', [CourseController::class, 'update']);
        $group->delete('/courses/{slug}', [CourseController::class, 'delete']);

        // Catalogue Management: Packages
        $group->get('/packages', [PackageController::class, 'listForAdmin']);
        $group->post('/packages', [PackageController::class, 'create']);
        $group->put('/packages/{id}', [PackageController::class, 'update']);
        $group->delete('/packages/{id}', [PackageController::class, 'delete']);

        // Student Management
        $group->get('/students', [AdminController::class, 'listStudents']);
        $group->put('/students/{id}', [AdminController::class, 'updateStudent']);
        $group->post('/students/{id}/deactivate', [AdminController::class, 'deactivateStudent']);
        $group->post('/students/{id}/reactivate', [AdminController::class, 'reactivateStudent']);

        // Payment Management
        $group->get('/payments', [AdminController::class, 'listPayments']);
        $group->post('/payments/{id}/refund', [AdminController::class, 'refundPayment']);

        // Enrollment Management
        $group->get('/enrollments', [EnrollmentController::class, 'listAll']);

        // Exam Management
        $group->get('/exams', [AdminController::class, 'listExams']);
        $group->post('/exams', [AdminController::class, 'createExam']);
        $group->get('/exams/{id}', [AdminController::class, 'getExam']);
        $group->put('/exams/{id}', [AdminController::class, 'updateExam']);

        // Exam Centre Management
        $group->get('/exam-centres', [ExamCentreController::class, 'list']);
        $group->get('/exam-centres/{id}', [ExamCentreController::class, 'get']);
        $group->post('/exam-centres', [ExamCentreController::class, 'create']);
        $group->put('/exam-centres/{id}', [ExamCentreController::class, 'update']);
        $group->delete('/exam-centres/{id}', [ExamCentreController::class, 'delete']);

        // Exam-day Operations: Candidates
        $group->get('/exams/{examId}/candidates', [ExamCandidateController::class, 'listByExam']);
        $group->post('/exams/{examId}/candidates', [ExamCandidateController::class, 'register']);
        $group->post(
            '/exams/{examId}/candidates/register-enrolled',
            [ExamCandidateController::class, 'registerEnrolled']
        );
        $group->put('/candidates/{id}/attendance', [ExamCandidateController::class, 'markAttendance']);
        $group->get('/exams/{examId}/attendance-summary', [ExamCandidateController::class, 'attendanceSummary']);

        // Exam-day Operations: Admit Cards
        $group->get('/exams/{examId}/admit-cards', [AdmitCardController::class, 'listByExam']);
        $group->post('/exams/{examId}/admit-cards', [AdmitCardController::class, 'generate']);
        $group->post('/exams/{examId}/admit-cards/generate-all', [AdmitCardController::class, 'generateAll']);
        $group->post('/exams/{examId}/admit-cards/publish-all', [AdmitCardController::class, 'publishAll']);
        $group->post('/admit-cards/{id}/publish', [AdmitCardController::class, 'publish']);
        $group->post('/admit-cards/{id}/revoke', [AdmitCardController::class, 'revoke']);

        // Exam-day Operations: Credentials
        $group->get('/exams/{examId}/credentials', [ExamCredentialController::class, 'listByExam']);
        $group->post('/exams/{examId}/credentials', [ExamCredentialController::class, 'assign']);
        $group->post('/exams/{examId}/credentials/bulk', [ExamCredentialController::class, 'bulkAssign']);
        $group->post('/credentials/{id}/revoke', [ExamCredentialController::class, 'revoke']);

        // Answer Keys
        $group->get('/answer-keys', [AnswerKeyController::class, 'listAll']);
        $group->get('/exams/{examId}/answer-key', [AnswerKeyController::class, 'getForAdmin']);
        $group->post('/exams/{examId}/answer-key', [AnswerKeyController::class, 'upload']);
        $group->post('/exams/{examId}/answer-key/publish', [AnswerKeyController::class, 'publish']);
        $group->post('/exams/{examId}/answer-key/unpublish', [AnswerKeyController::class, 'unpublish']);

        // Response Sheets
        $group->get('/responses', [StudentResponseController::class, 'listUploads']);
        $group->get('/exams/{examId}/responses', [StudentResponseController::class, 'listByExam']);

        // Question Bank
        $group->get('/exams/{examId}/questions', [QuestionController::class, 'listByExam']);
        $group->post('/exams/{examId}/questions', [QuestionController::class, 'create']);
        $group->post('/exams/{examId}/questions/bulk', [QuestionController::class, 'bulkImport']);
        $group->put('/questions/{id}', [QuestionController::class, 'update']);
        $group->delete('/questions/{id}', [QuestionController::class, 'delete']);

        // Curriculum Authoring: Subjects
        $group->post('/courses/{slug}/subjects', [CurriculumController::class, 'createSubject']);
        $group->put('/subjects/{id}', [CurriculumController::class, 'updateSubject']);
        $group->delete('/subjects/{id}', [CurriculumController::class, 'deleteSubject']);

        // Curriculum Authoring: Topics
        $group->post('/topics', [CurriculumController::class, 'createTopic']);
        $group->put('/topics/{id}', [CurriculumController::class, 'updateTopic']);
        $group->delete('/topics/{id}', [CurriculumController::class, 'deleteTopic']);

        // Curriculum Authoring: Syllabus
        $group->post('/courses/{slug}/syllabus', [CurriculumController::class, 'addSyllabusUnit']);
        $group->put('/syllabus/{id}', [CurriculumController::class, 'updateSyllabusUnit']);
        $group->delete('/syllabus/{id}', [CurriculumController::class, 'deleteSyllabusUnit']);

        // Scoring Pipeline: StudentResponse + AnswerKey -> Result + TopicPerformance + ResultAnalysis + Leaderboard
        $group->post('/exams/{examId}/students/{studentId}/evaluate', [ScoringController::class, 'evaluateStudent']);
        $group->post('/exams/{examId}/evaluate', [ScoringController::class, 'evaluateExam']);
        $group->post('/exams/{examId}/leaderboard/rebuild', [ScoringController::class, 'rebuildLeaderboard']);

        // Results Publishing
        $group->get('/exams/{examId}/results', [ResultController::class, 'listByExam']);
        $group->post('/exams/{examId}/publish-results', [ResultController::class, 'publish']);

        // Reports & Analytics
        // /analytics has no caller anywhere in the frontend (the Analytics
        // page uses the specific /analytics/revenue-trend etc. routes
        // above instead) - left on the dashboard-stats placeholder since
        // nothing actually hits it. /reports is real: ReportsCentre calls
        // it and expects an array of report definitions, which
        // getDashboard's object shape isn't - see AdminService::getReports().
        $group->get('/reports', [AdminController::class, 'getReports']);
        $group->get('/analytics', [AdminController::class, 'getDashboard']);
    });

    $group->add(AdminMiddleware::class);
};
