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
import type { Exam } from "@/types";
import { resolve, get } from "./http";

const studentExams: Exam[] = STUDENT_EXAM_IDS.map((id) => getExam(id)!).filter(Boolean);

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
  me: () => resolve(CURRENT_STUDENT, "/students/me"),
  getById: (id: string) => resolve(getStudent(id), `/students/${id}`),
  list: () => resolve(STUDENTS, "/students"),

  // Enrollments & Payments
  enrollments: () => resolve(STUDENT_ENROLLMENTS, "/students/me/enrollments"),
  payments: () => resolve(STUDENT_PAYMENTS, "/students/me/payments"),

  // Exams
  exams: () => resolve(studentExams, "/students/me/exams"),
  upcomingExam: async () => {
    const exams = await resolve(studentExams, "/students/me/exams");
    return exams.find((e) => new Date(e.date) >= new Date("2026-09-05"));
  },
  centre: (id: string) => resolve(getCentre(id), `/exam-centres/${id}`),

  // Results & Performance
  results: () => resolve(STUDENT_RESULTS, "/students/me/results"),
  latestResult: () => resolve(LATEST_RESULT, "/students/me/results/latest"),
  result: (id: string) => resolve(getResult(id), `/results/${id}`),
  performance: () => resolve(PERFORMANCE, "/students/me/analytics"),

  // Exam Details
  responses: (examId: string) => resolve(STUDENT_RESPONSES[examId], `/students/me/exams/${examId}/responses`),
  answerKey: (examId: string) => resolve(ANSWER_KEYS[examId], `/exams/${examId}/answer-key`),

  // Admit Cards & Credentials
  admitCard: () => resolve(STUDENT_ADMIT_CARD, "/students/me/admit-card"),
  examCredential: () => resolve(STUDENT_EXAM_CREDENTIAL, "/students/me/exam-credential"),

  // Notifications
  notifications: () => resolve(STUDENT_NOTIFICATIONS, "/students/me/notifications"),
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
