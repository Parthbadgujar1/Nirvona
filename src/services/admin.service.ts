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

export const adminService = {
  stats: () => resolve(ADMIN_STATS),
  activity: () => resolve(ACTIVITY),
  students: () => resolve(STUDENTS),
  payments: () => resolve(PAYMENTS),
  enrollments: () => resolve(ENROLLMENTS),
  exams: () => resolve(EXAMS),
  exam: (id: string) => resolve(getExam(id)),
  centres: () => resolve(EXAM_CENTRES),
  centre: (id: string) => resolve(getCentre(id)),
  candidates: (examId: string) => resolve(EXAM_CANDIDATES.filter((c) => c.examId === examId)),
  credentials: (examId: string) => resolve(EXAM_CREDENTIALS.filter((c) => c.examId === examId)),
  admitCards: (examId: string) => resolve(ADMIT_CARDS.filter((a) => a.examId === examId)),
  answerKeys: () => resolve(ANSWER_KEYS),
  responses: () => resolve(RESPONSE_UPLOADS),
  results: () => resolve(COHORT_RESULTS),
  reports: () => resolve(REPORTS),
  notifications: () => resolve(ADMIN_NOTIFICATIONS),

  /** Simulates the server-side validation pass on a credential workbook. */
  validateCredentialUpload: async (): Promise<UploadValidationResult> =>
    resolve(CREDENTIAL_UPLOAD_RESULT, 900),
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
