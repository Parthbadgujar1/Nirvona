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
import { resolve } from "./http";

const studentExams: Exam[] = STUDENT_EXAM_IDS.map((id) => getExam(id)!).filter(Boolean);

export const studentService = {
  me: () => resolve(CURRENT_STUDENT),
  getById: (id: string) => resolve(getStudent(id)),
  list: () => resolve(STUDENTS),
  enrollments: () => resolve(STUDENT_ENROLLMENTS),
  payments: () => resolve(STUDENT_PAYMENTS),
  exams: () => resolve(studentExams),
  upcomingExam: () => resolve(studentExams.find((e) => new Date(e.date) >= new Date("2026-09-05"))),
  centre: (id: string) => resolve(getCentre(id)),
  results: () => resolve(STUDENT_RESULTS),
  latestResult: () => resolve(LATEST_RESULT),
  result: (id: string) => resolve(getResult(id)),
  performance: () => resolve(PERFORMANCE),
  responses: (examId: string) => resolve(STUDENT_RESPONSES[examId]),
  answerKey: (examId: string) => resolve(ANSWER_KEYS[examId]),
  admitCard: () => resolve(STUDENT_ADMIT_CARD),
  examCredential: () => resolve(STUDENT_EXAM_CREDENTIAL),
  notifications: () => resolve(STUDENT_NOTIFICATIONS),
};

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
