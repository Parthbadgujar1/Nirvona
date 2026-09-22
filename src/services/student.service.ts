import { CURRENT_STUDENT, STUDENTS, getStudent } from "@/data/students";
import { STUDENT_ENROLLMENTS, STUDENT_PAYMENTS } from "@/data/payments";
import { EXAMS, STUDENT_EXAM_IDS, getCentre, getExam } from "@/data/exams";
import {
  ANSWER_KEYS,
  LATEST_RESULT,
  PERFORMANCE,
  STUDENT_RESPONSES,
  STUDENT_RESULTS,
  getResult,
} from "@/data/results";
import {
  STUDENT_ADMIT_CARD,
  STUDENT_EXAM_CREDENTIAL,
  STUDENT_NOTIFICATIONS,
} from "@/data/operations";
import type { AppNotification, Enrollment, Exam, PerformanceAnalysis, Result, Student } from "@/types";
import { resolve, put, ApiError } from "./http";

export interface StudentDashboard {
  student: typeof CURRENT_STUDENT;
  enrollments: Enrollment[];
  exams: Exam[];
  results: Result[];
  performance: PerformanceAnalysis;
  notifications: AppNotification[];
}

const studentExams: Exam[] = STUDENT_EXAM_IDS.map((id) => getExam(id)!).filter(Boolean);

/**
 * Some resources are legitimately absent rather than broken - a
 * student who hasn't had an admit card generated yet, or has no
 * assigned exam login for a given exam, gets a real 404 from the
 * backend for that. Treating a 404 as `undefined` instead of a thrown
 * error lets the page render its "not available yet" empty state
 * instead of an error banner for something that isn't actually wrong.
 */
async function resolveOptional<T>(promise: Promise<T>): Promise<T | undefined> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

/**
 * Student Service - Backend Integrated
 *
 * Routes:
 * - GET /api/students/me - Current student profile
 * - GET /api/students/:id - Get student by ID
 * - GET /api/students - List all students
 * - GET /api/students/:id/enrollments - Student enrollments
 * - GET /api/students/:id/payments - Student payments
 * - GET /api/exams - List student exams
 * - GET /api/students/:id/results - Student results
 * - GET /api/results/:id - Get specific result
 * - GET /api/students/:id/analytics - Performance analytics
 */
export const studentService = {
  // Profile
  me: (): Promise<Student> => resolve(CURRENT_STUDENT, "/students/me"),
  /** Persist the signed-in student's own profile (name, contact, address, guardian, notification prefs). */
  updateProfile: (payload: Record<string, unknown>): Promise<Student> => put("/students/me", payload),
  changePassword: (currentPassword: string, newPassword: string): Promise<void> =>
    put("/students/me/password", { currentPassword, newPassword }),

  // Combines the profile/enrollments/exams/results/performance/
  // notifications fetches the dashboard page needs into one request,
  // instead of 6 separate round trips (see StudentController::getDashboard).
  dashboard: (): Promise<StudentDashboard> =>
    resolve(
      {
        student: CURRENT_STUDENT,
        enrollments: STUDENT_ENROLLMENTS,
        exams: studentExams,
        results: STUDENT_RESULTS,
        performance: PERFORMANCE,
        notifications: STUDENT_NOTIFICATIONS,
      },
      "/students/me/dashboard",
    ),
  getById: (id: string) => resolve(getStudent(id), `/students/${id}`),
  list: () => resolve(STUDENTS, "/students"),

  // Enrollments & Payments
  enrollments: () => resolve(STUDENT_ENROLLMENTS, "/students/me/enrollments"),
  payments: () => resolve(STUDENT_PAYMENTS, "/students/me/payments"),

  // Exams
  exams: () => resolve(studentExams, "/students/me/exams"),
  upcomingExam: async () => {
    const exams = await resolve(studentExams, "/students/me/exams");
    return exams.find((e) => new Date(e.date) >= new Date());
  },
  centre: (id: string) => resolve(getCentre(id), `/exam-centres/${id}`),

  // Results & Performance
  results: () => resolve(STUDENT_RESULTS, "/students/me/results"),
  latestResult: () => resolve(LATEST_RESULT, "/students/me/results/latest"),
  // Every "View result" link across the app passes an examId here, not
  // a result's own id - this used to hit GET /results/{id} (a
  // different primary key lookup), which 404'd on every real result
  // once any existed. The real endpoint is scoped by exam instead.
  result: (examId: string) => resolve(getResult(examId), `/students/me/exams/${examId}/result`),
  performance: () => resolve(PERFORMANCE, "/students/me/analytics"),

  // Exam Details
  responses: (examId: string) => resolve(STUDENT_RESPONSES[examId], `/students/me/exams/${examId}/responses`),
  answerKey: (examId: string) => resolve(ANSWER_KEYS[examId], `/exams/${examId}/answer-key`),

  // Admit Cards & Credentials
  admitCard: () => resolveOptional(resolve(STUDENT_ADMIT_CARD, "/students/me/admit-card")),
  // There's no exam-agnostic "the" credential - a login is always
  // scoped to one exam - so this needs the student + exam id rather
  // than a bare /students/me/exam-credential (a route that was never
  // built because it has no exam to look up against; calling it 404'd
  // on every load).
  //
  // The id in the URL comes from the verified JWT (AuthMiddleware), not
  // from `studentId` here - the unauthenticated /students/{id}/... routes
  // this used to hit were removed as a security fix (anyone could read
  // anyone else's exam-hall credential by changing the id in the URL);
  // `studentId` stays a parameter only because the caller already has it
  // to hand and it does no harm to keep the call shape explicit.
  examCredential: (studentId: string, examId: string) =>
    resolveOptional(resolve(STUDENT_EXAM_CREDENTIAL, `/students/me/exams/${examId}/credential`)),

  // Notifications
  notifications: () => resolve(STUDENT_NOTIFICATIONS, "/students/me/notifications"),
  unreadNotificationCount: async (): Promise<number> => {
    const result = await resolve({ count: 0 }, "/students/me/notifications/unread-count");
    return result.count;
  },
  markNotificationRead: (id: string) => put(`/students/me/notifications/${id}/read`, {}),
  markAllNotificationsRead: () => put("/students/me/notifications/read-all", {}),
};

/**
 * Student Data - Mock data fallback
 * Used when API is unavailable or in mock mode
 */
export const studentData = {
  CURRENT_STUDENT,
  STUDENTS,
  STUDENT_ENROLLMENTS,
  STUDENT_PAYMENTS,
  studentExams,
  EXAMS,
  STUDENT_RESULTS,
  LATEST_RESULT,
  PERFORMANCE,
  STUDENT_RESPONSES,
  ANSWER_KEYS,
  STUDENT_ADMIT_CARD,
  STUDENT_EXAM_CREDENTIAL,
  STUDENT_NOTIFICATIONS,
  getCentre,
  getExam,
  getResult,
};
