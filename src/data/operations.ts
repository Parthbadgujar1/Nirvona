import type {
  ActivityItem,
  AdmitCard,
  AdminStats,
  AppNotification,
  ExamCandidate,
  ExamCredential,
} from "@/types";
import { seeded } from "@/lib/utils";
import { STUDENTS, CURRENT_STUDENT } from "./students";

export const ADMIN_STATS: AdminStats = {
  totalStudents: 12842,
  activeEnrollments: 8921,
  successfulPurchases: 9436,
  revenue: 482000 * 10 + 2000,
  upcomingExams: 4,
  pendingResults: 2,
  deltas: {
    totalStudents: 8.4,
    activeEnrollments: 6.1,
    successfulPurchases: 11.2,
    revenue: 14.7,
    upcomingExams: 0,
    pendingResults: -12.5,
  },
};

export const ACTIVITY: ActivityItem[] = [
  { id: "ACT-01", actor: "Rahul Nair", action: "purchased", target: "JEE Advantage — 1 Year package", type: "purchase", at: "2026-09-05T09:42:00Z" },
  { id: "ACT-02", actor: "System", action: "generated admit cards for", target: "CBT-04 (1,210 candidates)", type: "admit-card", at: "2026-09-05T08:15:00Z" },
  { id: "ACT-03", actor: "Nikhil Raghavan", action: "uploaded exam credentials for", target: "CBT-04 (1,180 assigned)", type: "credential", at: "2026-09-04T18:04:00Z" },
  { id: "ACT-04", actor: "System", action: "published answer key for", target: "CBT-03", type: "exam", at: "2026-09-03T21:10:00Z" },
  { id: "ACT-05", actor: "Meera Krishnan", action: "purchased", target: "NEET Advantage — 6 Months package", type: "purchase", at: "2026-09-03T16:38:00Z" },
  { id: "ACT-06", actor: "Priya Menon", action: "published results for", target: "CBT-03 (1,188 candidates)", type: "result", at: "2026-09-02T12:22:00Z" },
  { id: "ACT-07", actor: "System", action: "registered", target: "128 new students today", type: "student", at: "2026-09-02T09:00:00Z" },
  { id: "ACT-08", actor: "Arjun Malhotra", action: "purchased", target: "JEE Advantage — 2 Years package", type: "purchase", at: "2026-09-01T19:51:00Z" },
];

/* ------------------------- Candidates & credentials ------------------ */

const rng = seeded(7717);

export const EXAM_CANDIDATES: ExamCandidate[] = STUDENTS.map((student, index) => {
  const roll = rng();
  return {
    studentId: student.id,
    studentName: student.fullName,
    examId: "CBT-04",
    seatNo: `L${((index % 6) + 1)}-${String(index + 12).padStart(3, "0")}`,
    admitCardStatus: roll > 0.86 ? "pending" : roll > 0.6 ? "generated" : "published",
    credentialStatus: roll > 0.9 ? "pending" : roll > 0.96 ? "invalid" : "assigned",
    attendance: "pending",
  } satisfies ExamCandidate;
});

/** Fake, non-functional demo credentials. Never real values. */
export const EXAM_CREDENTIALS: ExamCredential[] = STUDENTS.map((student, index) => {
  const roll = rng();
  const status =
    roll > 0.93 ? "pending" : roll > 0.9 ? "duplicate" : roll > 0.87 ? "invalid" : "assigned";
  return {
    studentId: student.id,
    studentName: student.fullName,
    examId: "CBT-04",
    loginId: `NV04${String(20481 + index * 17)}`,
    password: `DEMO-${String.fromCharCode(65 + (index % 26))}${String(4821 + index * 31)}`,
    status,
    assignedAt: status === "assigned" ? "2026-09-04T18:04:00Z" : undefined,
  } satisfies ExamCredential;
});

/** The demo student's exam-hall credential for CBT-04 (demo values only). */
export const STUDENT_EXAM_CREDENTIAL: ExamCredential = {
  studentId: CURRENT_STUDENT.id,
  studentName: CURRENT_STUDENT.fullName,
  examId: "CBT-04",
  loginId: "NV04-20481",
  password: "DEMO-A4821",
  status: "assigned",
  assignedAt: "2026-09-04T18:04:00Z",
};

export const ADMIT_CARDS: AdmitCard[] = STUDENTS.map((student, index) => ({
  id: `AC-CBT04-${String(index + 1).padStart(4, "0")}`,
  studentId: student.id,
  examId: "CBT-04",
  rollNumber: `NV26${String(100418 + index * 23)}`,
  seatNo: `L${((index % 6) + 1)}-${String(index + 12).padStart(3, "0")}`,
  status: index % 11 === 3 ? "pending" : index % 5 === 0 ? "generated" : index % 3 === 0 ? "sent" : "published",
  generatedAt: index % 11 === 3 ? undefined : "2026-09-05T08:15:00Z",
  publishedAt: index % 11 === 3 || index % 5 === 0 ? undefined : "2026-09-05T10:00:00Z",
}));

export const STUDENT_ADMIT_CARD: AdmitCard = {
  id: "AC-CBT04-0001",
  studentId: CURRENT_STUDENT.id,
  examId: "CBT-04",
  rollNumber: "NV26100418",
  seatNo: "L1-012",
  status: "published",
  generatedAt: "2026-09-05T08:15:00Z",
  publishedAt: "2026-09-05T10:00:00Z",
};

/* ---------------------------- Notifications -------------------------- */

export const ADMIN_NOTIFICATIONS: AppNotification[] = [
  { id: "NTF-101", title: "CBT-04 admit cards are live", message: "Admit cards for CBT-04 have been published. Students can download them from their portal.", type: "admit-card", channel: "whatsapp", audience: "CBT-04 candidates", recipients: 1210, status: "delivered", createdAt: "2026-09-05T10:05:00Z" },
  { id: "NTF-102", title: "CBT-04 exam reminder", message: "Your examination is on 15 September 2026. Reporting time 09:00 AM.", type: "exam", channel: "sms", audience: "CBT-04 candidates", recipients: 1284, status: "sent", createdAt: "2026-09-05T07:00:00Z" },
  { id: "NTF-103", title: "CBT-03 result published", message: "Your CBT-03 result and detailed performance analysis are now available.", type: "result", channel: "email", audience: "CBT-03 candidates", recipients: 1188, status: "delivered", createdAt: "2026-09-02T12:30:00Z" },
  { id: "NTF-104", title: "Payment confirmation", message: "We have received your payment. Your enrolment is now active.", type: "payment", channel: "email", audience: "New purchases", recipients: 204, status: "delivered", createdAt: "2026-09-01T16:00:00Z" },
  { id: "NTF-105", title: "Centre change — Lucknow", message: "The Gomti Nagar centre is temporarily unavailable. Affected candidates have been reallocated.", type: "general", channel: "whatsapp", audience: "Lucknow centre candidates", recipients: 96, status: "failed", createdAt: "2026-08-30T11:20:00Z" },
  { id: "NTF-106", title: "Answer key window closing", message: "Objections to the CBT-03 answer key close tonight at 11:59 PM.", type: "exam", channel: "portal", audience: "CBT-03 candidates", recipients: 1188, status: "pending", createdAt: "2026-08-28T09:00:00Z" },
];

export const STUDENT_NOTIFICATIONS: AppNotification[] = [
  { id: "SN-01", title: "Your CBT-04 admit card is available", message: "Download your admit card for CBT-04 on 15 September 2026. Your exam-hall login credentials are printed on it.", type: "admit-card", channel: "portal", audience: "You", recipients: 1, status: "delivered", createdAt: "2026-09-05T10:05:00Z", read: false },
  { id: "SN-02", title: "CBT-04 reporting time confirmed", message: "Report at 09:00 AM at Nirvona Examination Centre — Malviya Nagar, Jaipur.", type: "exam", channel: "whatsapp", audience: "You", recipients: 1, status: "delivered", createdAt: "2026-09-05T07:02:00Z", read: false },
  { id: "SN-03", title: "CBT-03 result published", message: "You scored 287/360 with an All-India Rank of 127. View your detailed analysis.", type: "result", channel: "email", audience: "You", recipients: 1, status: "delivered", createdAt: "2026-09-02T12:31:00Z", read: true },
  { id: "SN-04", title: "CBT-03 answer key released", message: "Compare your responses against the official answer key.", type: "exam", channel: "portal", audience: "You", recipients: 1, status: "delivered", createdAt: "2026-08-28T20:00:00Z", read: true },
  { id: "SN-05", title: "Payment successful", message: "₹13,584 received for JEE Advantage — 1 Year. Receipt ORD-2026-00918 is available in your account.", type: "payment", channel: "email", audience: "You", recipients: 1, status: "delivered", createdAt: "2026-05-18T14:22:00Z", read: true },
];

/* ------------------------------ Reports ------------------------------ */

export const REPORTS = [
  { id: "RPT-01", name: "Student Master Report", description: "Every registered student with contact, class, course and enrolment status.", records: 12842, updated: "2026-09-05", category: "People" },
  { id: "RPT-02", name: "Purchase Report", description: "All purchase attempts with package, amount and payment gateway reference.", records: 11208, updated: "2026-09-05", category: "Finance" },
  { id: "RPT-03", name: "Payment Report", description: "Settled, pending, failed and refunded transactions with reconciliation status.", records: 11208, updated: "2026-09-05", category: "Finance" },
  { id: "RPT-04", name: "Exam Participation Report", description: "Registered vs appeared vs absent candidates, per exam and per centre.", records: 4891, updated: "2026-09-02", category: "Examinations" },
  { id: "RPT-05", name: "Admit Card Report", description: "Generation, publication and delivery status of every admit card.", records: 1284, updated: "2026-09-05", category: "Examinations" },
  { id: "RPT-06", name: "Credential Report", description: "Exam-hall credential assignment status with validation exceptions.", records: 1284, updated: "2026-09-04", category: "Examinations" },
  { id: "RPT-07", name: "Result Report", description: "Scores, ranks, percentiles and subject-wise breakdown per candidate.", records: 1188, updated: "2026-09-02", category: "Evaluation" },
  { id: "RPT-08", name: "Centre Performance Report", description: "Average score, attendance and infrastructure utilisation per centre.", records: 6, updated: "2026-09-02", category: "Examinations" },
];

/* ------------------------- Credential upload demo -------------------- */

export const CREDENTIAL_UPLOAD_RESULT = {
  processed: 1284,
  successful: 1260,
  duplicate: 12,
  invalid: 8,
  missingStudentId: 4,
  rows: [
    { row: 118, studentId: "NIRV-2026-01184", studentName: "Riya Chauhan", loginId: "NV04-20612", status: "duplicate" as const, message: "Login ID already assigned to NIRV-2026-01093" },
    { row: 246, studentId: "NIRV-2026-01249", studentName: "Devansh Joshi", loginId: "NV04 20618", status: "invalid" as const, message: "Login ID contains a space" },
    { row: 402, studentId: "", studentName: "Unknown", loginId: "NV04-20744", status: "invalid" as const, message: "Student ID column is empty" },
    { row: 519, studentId: "NIRV-2026-09999", studentName: "—", loginId: "NV04-20801", status: "invalid" as const, message: "Student ID not found in CBT-04 candidate list" },
    { row: 733, studentId: "NIRV-2026-01418", studentName: "Simran Kaur", loginId: "NV04-20612", status: "duplicate" as const, message: "Duplicate login ID within uploaded file" },
    { row: 981, studentId: "NIRV-2026-01521", studentName: "Rohan Ghosh", loginId: "nv04-20955", status: "invalid" as const, message: "Password field is blank" },
  ],
};

export const CREDENTIAL_TEMPLATE_COLUMNS = [
  { column: "Student ID", example: "NIRV-2026-01041", required: true, note: "Must match a candidate enrolled for the selected exam" },
  { column: "Student Name", example: "Aarav Sharma", required: true, note: "Used only for verification against the candidate list" },
  { column: "Exam", example: "CBT-04", required: true, note: "Must match the selected exam code exactly" },
  { column: "Exam Login ID", example: "NV04-20481", required: true, note: "Unique across the exam; alphanumeric and hyphen only" },
  { column: "Exam Password", example: "DEMO-A4821", required: true, note: "8–16 characters; never reuse portal passwords" },
];

export const RESPONSE_UPLOADS = [
  { examId: "CBT-03", students: 1188, uploadedAt: "2026-08-16T19:40:00Z", validation: "valid" as const, processing: "evaluated" as const },
  { examId: "CBT-02", students: 1119, uploadedAt: "2026-07-12T19:12:00Z", validation: "valid" as const, processing: "evaluated" as const },
  { examId: "CBT-01", students: 1042, uploadedAt: "2026-06-14T19:04:00Z", validation: "valid" as const, processing: "evaluated" as const },
];
