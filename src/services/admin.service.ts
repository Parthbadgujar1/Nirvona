import { EXAMS, EXAM_CENTRES, getCentre, getExam } from "@/data/exams";
import { STUDENTS } from "@/data/students";
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
import type { UploadValidationResult } from "@/types";
import { resolve } from "./http";

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

  // Students & Enrollments
  students: () => resolve(STUDENTS, "/admin/students"),
  payments: () => resolve(PAYMENTS, "/admin/payments"),
  enrollments: () => resolve(ENROLLMENTS, "/admin/enrollments"),

  // Exams & Centres
  exams: () => resolve(EXAMS, "/admin/exams"),
  exam: (id: string) => resolve(getExam(id), `/admin/exams/${id}`),
  centres: () => resolve(EXAM_CENTRES, "/admin/exam-centres"),
  centre: (id: string) => resolve(getCentre(id), `/admin/exam-centres/${id}`),

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

  // Results & Reports
  answerKeys: () => resolve(ANSWER_KEYS, "/admin/answer-keys"),
  responses: () => resolve(RESPONSE_UPLOADS, "/admin/responses"),
  results: () => resolve(COHORT_RESULTS, "/admin/results"),
  reports: () => resolve(REPORTS, "/admin/reports"),

  // Notifications
  notifications: () => resolve(ADMIN_NOTIFICATIONS, "/admin/notifications"),

  /** Validate credential upload against backend rules */
  validateCredentialUpload: async (): Promise<UploadValidationResult> =>
    resolve(CREDENTIAL_UPLOAD_RESULT, "/admin/credentials/validate", { method: "POST" }, 900),
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
