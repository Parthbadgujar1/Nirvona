/* =====================================================================
   NIRVONA EDUCATION TECH — Domain types
   These mirror the shape a real API is expected to return, so the mock
   services in `src/services` can be swapped for HTTP calls unchanged.
   ===================================================================== */

export type ID = string;
export type ISODate = string;

/* ------------------------------- People ------------------------------ */

export type Role = "student" | "admin";

export interface Student {
  id: ID;                    // NIRV-2026-00123
  fullName: string;
  email: string;
  mobile: string;
  dateOfBirth: ISODate;
  gender?: "male" | "female" | "other";
  className: ClassLevel;
  school: string;
  city: string;
  state: string;
  examPreference: CourseSlug[];
  avatarUrl?: string;
  enrolledAt: ISODate;
  status: "active" | "inactive" | "suspended";
  guardianName?: string;
  guardianMobile?: string;
  address?: string;
}

// There is exactly one admin account type - no super-admin/exam-manager/
// support sub-roles (see AdminMiddleware, which only ever gates on the
// JWT's "admin" vs "student" role claim, never a per-admin sub-role).
export interface Admin {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
}

export type ClassLevel = "Class 11" | "Class 12" | "Dropper" | "Other";

/* ------------------------------ Catalogue ---------------------------- */

export type CourseSlug = "class-11" | "class-12" | "devoter" | "jee" | "neet";

export interface Course {
  slug: CourseSlug;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  audience: string[];
  subjects: Subject[];
  maxDurationMonths: 12 | 24;
  totalTests: number;
  accent: "navy" | "royal" | "ember" | "saffron" | "teal";
  icon: string;
  highlights: string[];
  examPattern: ExamPatternRow[];
  patternNotes: string[];
  syllabus: SyllabusUnit[];
  faqs: FAQ[];
  stats: { label: string; value: string }[];
}

export interface Subject {
  code: string;
  name: string;
  color: string;
}

export interface SyllabusUnit {
  subject: string;
  units: { title: string; topics: string[] }[];
}

export interface ExamPatternRow {
  section: string;
  questions: number;
  marks: number;
  type: string;
  negative: string;
}

export interface FAQ {
  q: string;
  a: string;
}

/* ------------------------------ Packages ----------------------------- */

export type PackageDuration = "3M" | "6M" | "1Y" | "2Y";

export interface Package {
  id: ID;
  courseSlug: CourseSlug;
  name: string;
  duration: PackageDuration;
  durationLabel: string;
  durationMonths: number;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  tests: number;
  recommended?: boolean;
  tagline: string;
  features: string[];
  benefits: string[];
  includes: {
    examAccess: boolean;
    analytics: boolean;
    answerKey: boolean;
    doubtSupport: boolean;
    mentorship: boolean;
    printedMaterial: boolean;
  };
}

/* ----------------------------- Enrollment ---------------------------- */

export interface Enrollment {
  id: ID;
  studentId: ID;
  courseSlug: CourseSlug;
  packageId: ID;
  startDate: ISODate;
  endDate: ISODate;
  status: "active" | "expired" | "cancelled";
  paymentId: ID;
  testsTaken: number;
  testsTotal: number;
}

/* ------------------------------- Exams ------------------------------- */

export type ExamStatus =
  | "draft"
  | "scheduled"
  | "admit-card-available"
  | "ongoing"
  | "completed"
  | "result-pending"
  | "result-published";

export interface Exam {
  id: ID;                       // CBT-04
  name: string;
  // Singular, matching the real `exams.courseSlug` column - an exam
  // belongs to exactly one course. This used to be `courseSlugs: CourseSlug[]`
  // (a mock-era, never-built multi-course concept); every real backend
  // response only ever sent one, so reading it as an array crashed on
  // real data everywhere it was consumed.
  courseSlug: CourseSlug;
  date: ISODate;
  reportingTime: string;
  examTime: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  centreId: ID;
  status: ExamStatus;
  // Real backend column is TEXT (one string, newline-separated), not an
  // array - was typed `string[]` and read with `.map()` directly,
  // which threw on real data. Nullable: most real exams never set one.
  instructions: string | null;
  candidates: number;
  admitCardsGenerated: number;
  credentialsAssigned: number;
  syllabusScope: string;
}

export interface ExamCentre {
  id: ID;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  capacity: number;
  labs: number;
  contact: string;
  status: "active" | "inactive";
}

export interface ExamCandidate {
  studentId: ID;
  studentName: string;
  examId: ID;
  seatNo?: string;
  admitCardStatus: AdmitCardStatus;
  credentialStatus: CredentialStatus;
  attendance?: "present" | "absent" | "pending";
}

/* --------------------------- Admit + Credentials --------------------- */

export type AdmitCardStatus = "pending" | "generated" | "published" | "sent" | "revoked";
export type CredentialStatus = "pending" | "assigned" | "invalid" | "duplicate" | "revoked";

export interface AdmitCard {
  id: ID;
  studentId: ID;
  /** Only present on admin listing endpoints (joined server-side); a
   * student's own admit card fetch already knows who they are. */
  studentName?: string;
  examId: ID;
  rollNumber: string;
  seatNo: string;
  status: AdmitCardStatus;
  generatedAt?: ISODate;
  publishedAt?: ISODate;
}

/** Exam-hall CBT login — deliberately separate from portal credentials. */
export interface ExamCredential {
  /** Only present on rows the backend actually issued (the mock
   * dataset predates this field and doesn't carry one). */
  id?: ID;
  studentId: ID;
  studentName: string;
  examId: ID;
  loginId: string;
  password: string;
  status: CredentialStatus;
  assignedAt?: ISODate;
}

/* ------------------------------ Payments ----------------------------- */

export type PaymentStatus = "successful" | "pending" | "failed" | "refunded";

export interface Payment {
  id: ID;                      // ORD-2026-00918
  transactionId: string;
  studentId: ID;
  studentName: string;
  courseSlug: CourseSlug;
  packageId: ID;
  packageName: string;
  duration: PackageDuration;
  amount: number;
  discount: number;
  tax: number;
  total: number;
  status: PaymentStatus;
  method: "UPI" | "Card" | "Netbanking" | "Wallet";
  date: ISODate;
}

export interface Receipt {
  payment: Payment;
  student: Pick<Student, "id" | "fullName" | "email" | "mobile" | "city" | "state">;
  issuedAt: ISODate;
}

/* ------------------------------- Results ----------------------------- */

export interface AnswerKeyEntry {
  qNo: number;
  subject: string;
  topic: string;
  correctOption: "A" | "B" | "C" | "D";
  marks: number;
  negative: number;
}

export interface AnswerKey {
  examId: ID;
  uploadedAt: ISODate;
  publishedAt?: ISODate;
  totalQuestions: number;
  status: "draft" | "validated" | "published" | "unpublished";
  entries: AnswerKeyEntry[];
}

export interface StudentResponseRow {
  qNo: number;
  subject: string;
  topic: string;
  markedOption: "A" | "B" | "C" | "D" | null;
  correctOption: "A" | "B" | "C" | "D";
  status: "correct" | "incorrect" | "unattempted";
  timeSpentSec: number;
  marks: number;
}

export interface StudentResponse {
  examId: ID;
  studentId: ID;
  uploadedAt: ISODate;
  validation: "valid" | "invalid" | "pending";
  processing: "queued" | "processing" | "evaluated" | "failed";
  rows: StudentResponseRow[];
}

export interface SubjectResult {
  subject: string;
  color: string;
  score: number;
  maxScore: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
  timeSpentMin: number;
  percentile: number;
}

export interface Result {
  id: ID;
  examId: ID;
  examName: string;
  studentId: ID;
  studentName: string;
  courseSlug: CourseSlug;
  date: ISODate;
  score: number;
  maxScore: number;
  percentage: number;
  rank: number;
  totalCandidates: number;
  percentile: number;
  accuracy: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  timeTakenMin: number;
  subjects: SubjectResult[];
  status: "processing" | "published";
  topPerformerScore: number;
  averageScore: number;
}

export interface TopicPerformance {
  topic: string;
  subject: string;
  accuracy: number;
  attempted: number;
  total: number;
  trend: number;
}

export interface PerformanceAnalysis {
  studentId: ID;
  scoreTrend: { exam: string; score: number; average: number; topper: number }[];
  rankTrend: { exam: string; rank: number; percentile: number }[];
  accuracyTrend: { exam: string; accuracy: number }[];
  subjectComparison: { subject: string; you: number; average: number; topper: number }[];
  topics: TopicPerformance[];
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  timeDistribution: { subject: string; minutes: number; color: string }[];
  summary: string;
  improvementPercent: number;
}

/* --------------------------- Notifications --------------------------- */

export type NotificationChannel = "whatsapp" | "sms" | "email" | "portal";
export type DeliveryStatus = "sent" | "delivered" | "failed" | "pending";

export interface AppNotification {
  id: ID;
  title: string;
  message: string;
  type: "exam" | "result" | "payment" | "admit-card" | "general";
  channel: NotificationChannel;
  audience: string;
  recipients: number;
  status: DeliveryStatus;
  createdAt: ISODate;
  read?: boolean;
}

/* ------------------------------ Admin ops ---------------------------- */

export interface UploadValidationResult {
  processed: number;
  successful: number;
  duplicate: number;
  invalid: number;
  missingStudentId: number;
  rows: {
    row: number;
    studentId: string;
    studentName: string;
    loginId: string;
    status: CredentialStatus;
    message?: string;
  }[];
}

export interface ActivityItem {
  id: ID;
  actor: string;
  action: string;
  target: string;
  type: "purchase" | "exam" | "result" | "credential" | "admit-card" | "student";
  at: ISODate;
}

export interface AdminStats {
  totalStudents: number;
  activeEnrollments: number;
  successfulPurchases: number;
  revenue: number;
  upcomingExams: number;
  pendingResults: number;
  deltas: Record<string, number>;
}

/* ------------------------------- Generic ----------------------------- */

export interface ApiResult<T> {
  data: T;
  meta?: { total: number; page: number; pageSize: number };
}

export type AsyncState = "idle" | "loading" | "success" | "error" | "empty";
