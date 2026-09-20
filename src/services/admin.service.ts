import { EXAMS, EXAM_CENTRES, getCentre, getExam } from "@/data/exams";
import { STUDENTS } from "@/data/students";
import { COURSES } from "@/data/courses";
import { PACKAGES } from "@/data/packages";
import {
  COURSE_SPLIT,
  ENROLLMENTS,
  PARTICIPATION_TREND,
  PAYMENTS,
  REGISTRATION_TREND,
  REVENUE_TREND,
} from "@/data/payments";
import {
  ACTIVITY,
  ADMIN_NOTIFICATIONS,
  ADMIN_STATS,
  ADMIT_CARDS,
  CREDENTIAL_TEMPLATE_COLUMNS,
  CREDENTIAL_UPLOAD_RESULT,
  EXAM_CANDIDATES,
  EXAM_CREDENTIALS,
  REPORTS,
  RESPONSE_UPLOADS,
} from "@/data/operations";
import {
  ANSWER_KEYS,
  CENTRE_PERFORMANCE,
  COHORT_RESULTS,
  SCORE_DISTRIBUTION,
} from "@/data/results";
import type {
  AnswerKey, AnswerKeyEntry, AppNotification, Course, Exam, ExamCentre, Package, Payment, Student,
  UploadValidationResult,
} from "@/types";
import { resolve, resolveAll, post, put, del } from "./http";

/**
 * Admin Service - Backend Integrated
 *
 * Routes:
 * - GET /api/admin/dashboard - Admin dashboard stats
 * - GET /api/admin/students - List all students
 * - GET /api/admin/payments - List payments
 * - GET /api/admin/exams - List exams
 * - GET /api/admin/exams/:id - Get exam details
 * - GET /api/admin/exam-centres - List exam centres
 * - POST /api/admin/results/publish - Publish exam results
 * - POST /api/admin/credentials/validate - Validate credential upload
 */
export const adminService = {
  // Dashboard & Analytics
  stats: () => resolve(ADMIN_STATS, "/admin/dashboard"),
  activity: () => resolve(ACTIVITY, "/admin/activity"),
  revenueTrend: () => resolve(REVENUE_TREND, "/admin/analytics/revenue-trend"),
  registrationTrend: () => resolve(REGISTRATION_TREND, "/admin/analytics/registration-trend"),
  participationTrend: () => resolve(PARTICIPATION_TREND, "/admin/analytics/participation-trend"),
  courseSplit: (): Promise<{ course: string; students: number }[]> =>
    resolve(
      COURSE_SPLIT.map(({ course, students }) => ({ course, students })),
      "/admin/analytics/course-split",
    ),

  // Students & Enrollments
  students: (): Promise<Student[]> => resolveAll(STUDENTS, "/admin/students"),
  updateStudent: (id: string, payload: Record<string, unknown>): Promise<Student> =>
    put(`/admin/students/${id}`, payload),
  deactivateStudent: (id: string): Promise<void> => post(`/admin/students/${id}/deactivate`, {}),
  reactivateStudent: (id: string): Promise<void> => post(`/admin/students/${id}/reactivate`, {}),
  payments: (): Promise<Payment[]> => resolveAll(PAYMENTS, "/admin/payments"),
  refundPayment: (id: string): Promise<Payment> => post(`/admin/payments/${id}/refund`, {}),
  enrollments: () => resolveAll(ENROLLMENTS, "/admin/enrollments"),

  // Catalogue: Courses & Packages
  courses: (): Promise<Course[]> => resolve(COURSES, "/admin/courses"),
  createCourse: (payload: Record<string, unknown>): Promise<Course> => post("/admin/courses", payload),
  updateCourse: (slug: string, payload: Record<string, unknown>): Promise<Course> =>
    put(`/admin/courses/${slug}`, payload),
  deleteCourse: (slug: string): Promise<void> => del(`/admin/courses/${slug}`),
  packages: (): Promise<Package[]> => resolve(PACKAGES, "/admin/packages"),
  createPackage: (payload: Record<string, unknown>): Promise<Package> => post("/admin/packages", payload),
  updatePackage: (id: string, payload: Record<string, unknown>): Promise<Package> =>
    put(`/admin/packages/${id}`, payload),
  deletePackage: (id: string): Promise<void> => del(`/admin/packages/${id}`),

  // Exams & Centres
  exams: () => resolveAll(EXAMS, "/admin/exams"),
  exam: (id: string) => resolve(getExam(id), `/admin/exams/${id}`),
  createExam: (payload: Record<string, unknown>): Promise<Exam> => post("/admin/exams", payload),
  updateExam: (id: string, payload: Record<string, unknown>): Promise<Exam> =>
    put(`/admin/exams/${id}`, payload),
  centres: () => resolve(EXAM_CENTRES, "/admin/exam-centres"),
  centre: (id: string) => resolve(getCentre(id), `/admin/exam-centres/${id}`),
  createCentre: (payload: Record<string, unknown>): Promise<ExamCentre> =>
    post("/admin/exam-centres", payload),
  updateCentre: (id: string, payload: Record<string, unknown>): Promise<ExamCentre> =>
    put(`/admin/exam-centres/${id}`, payload),
  deleteCentre: (id: string): Promise<void> => del(`/admin/exam-centres/${id}`),

  // Exam Management
  candidates: (examId: string) =>
    resolve(
      EXAM_CANDIDATES.filter((c) => c.examId === examId),
      `/admin/exams/${examId}/candidates`,
    ),
  credentials: (examId: string) =>
    resolve(
      EXAM_CREDENTIALS.filter((c) => c.examId === examId),
      `/admin/exams/${examId}/credentials`,
    ),
  admitCards: (examId: string) =>
    resolve(
      ADMIT_CARDS.filter((a) => a.examId === examId),
      `/admin/exams/${examId}/admit-cards`,
    ),
  generateAdmitCards: (
    examId: string,
  ): Promise<{ generated: number; alreadyExisted: number; totalCandidates: number }> =>
    post(`/admin/exams/${examId}/admit-cards/generate-all`, {}),
  publishAdmitCards: (examId: string): Promise<{ published: number }> =>
    post(`/admin/exams/${examId}/admit-cards/publish-all`, {}),
  publishAdmitCard: (id: string) => post(`/admin/admit-cards/${id}/publish`, {}),

  // Results & Reports
  // Was `resolve(ANSWER_KEYS, ...)` - ANSWER_KEYS is a Record keyed by
  // examId (the mock shape), but the real endpoint returns an array
  // (see AnswerKeyRepository::getAll), so this silently lied about its
  // own return type even though `resolve()`'s real-data path was
  // already correct at runtime.
  answerKeys: (): Promise<AnswerKey[]> => resolve(Object.values(ANSWER_KEYS), "/admin/answer-keys"),
  uploadAnswerKey: (examId: string, entries: AnswerKeyEntry[]): Promise<AnswerKey> =>
    post(`/admin/exams/${examId}/answer-key`, { entries }),
  publishAnswerKey: (examId: string) => post(`/admin/exams/${examId}/answer-key/publish`, {}),
  unpublishAnswerKey: (examId: string) => post(`/admin/exams/${examId}/answer-key/unpublish`, {}),
  responses: () => resolve(RESPONSE_UPLOADS, "/admin/responses"),
  evaluateExam: (
    examId: string,
  ): Promise<{ evaluated: number; failed: string[]; leaderboardSize: number }> =>
    post(`/admin/exams/${examId}/evaluate`, {}),
  // There's no bare /admin/results - a result only makes sense scoped
  // to one exam (the admin review table is always "review this exam's
  // candidates"), matching how the real backend organizes them.
  resultsForExam: (examId: string) => resolve(COHORT_RESULTS, `/admin/exams/${examId}/results`),
  publishExamResults: (examId: string) => post(`/admin/exams/${examId}/publish-results`, {}),
  reports: () => resolve(REPORTS, "/admin/reports"),

  // Notifications
  notifications: () => resolve(ADMIN_NOTIFICATIONS, "/admin/notifications"),
  sendNotification: (payload: {
    title: string;
    message: string;
    type: string;
    channels: string[];
    examId: string;
  }): Promise<AppNotification[]> => post("/admin/notifications", payload),
  retryNotification: (id: string) => post(`/admin/notifications/${id}/retry`, {}),
  deleteNotification: (id: string): Promise<void> => del(`/admin/notifications/${id}`),

  /** Validate credential upload against backend rules */
  validateCredentialUpload: async (): Promise<UploadValidationResult> =>
    resolve(CREDENTIAL_UPLOAD_RESULT, "/admin/credentials/validate", { method: "POST" }, 900),

  /** Exam-hall credential/admit-card revocation */
  revokeCredential: (id: string): Promise<void> => post(`/admin/credentials/${id}/revoke`, {}),
  revokeAdmitCard: (id: string): Promise<void> => post(`/admin/admit-cards/${id}/revoke`, {}),
};

export const adminData = {
  ADMIN_STATS,
  ACTIVITY,
  STUDENTS,
  PAYMENTS,
  ENROLLMENTS,
  EXAMS,
  EXAM_CENTRES,
  EXAM_CANDIDATES,
  EXAM_CREDENTIALS,
  ADMIT_CARDS,
  ANSWER_KEYS,
  RESPONSE_UPLOADS,
  COHORT_RESULTS,
  REPORTS,
  ADMIN_NOTIFICATIONS,
  CREDENTIAL_UPLOAD_RESULT,
  CREDENTIAL_TEMPLATE_COLUMNS,
  REVENUE_TREND,
  REGISTRATION_TREND,
  PARTICIPATION_TREND,
  COURSE_SPLIT,
  SCORE_DISTRIBUTION,
  CENTRE_PERFORMANCE,
  getExam,
  getCentre,
};
