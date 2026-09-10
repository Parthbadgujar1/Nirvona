import type { CourseSlug, Enrollment, Payment, PaymentStatus } from "@/types";
import { seeded } from "@/lib/utils";
import { PACKAGES, getPackage } from "./packages";
import { STUDENTS, CURRENT_STUDENT } from "./students";

const STATUSES: PaymentStatus[] = [
  "successful", "successful", "successful", "successful", "successful",
  "successful", "pending", "successful", "failed", "successful",
  "successful", "refunded", "successful", "successful", "pending",
  "successful", "failed", "successful", "successful", "successful",
  "successful", "successful",
];

const METHODS: Payment["method"][] = ["UPI", "Card", "Netbanking", "UPI", "Wallet", "UPI", "Card"];

const rng = seeded(9137);

export const PAYMENTS: Payment[] = STUDENTS.map((student, index) => {
  const course: CourseSlug = student.examPreference[0];
  const options = PACKAGES.filter((p) => p.courseSlug === course);
  const pkg = options[index % options.length];
  const discount = pkg.originalPrice ? pkg.originalPrice - pkg.price : 0;
  const tax = Math.round(pkg.price * 0.18);
  const day = ((index * 3) % 27) + 1;
  const month = ((index % 5) + 4);
  return {
    id: `ORD-2026-${String(918 + index * 7).padStart(5, "0")}`,
    transactionId: `pay_${Math.floor(rng() * 1e12).toString(36).toUpperCase().padStart(12, "0")}`,
    studentId: student.id,
    studentName: student.fullName,
    courseSlug: course,
    packageId: pkg.id,
    packageName: pkg.name,
    duration: pkg.duration,
    amount: pkg.originalPrice ?? pkg.price,
    discount,
    tax,
    total: pkg.price + tax,
    status: STATUSES[index % STATUSES.length],
    method: METHODS[index % METHODS.length],
    date: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  } satisfies Payment;
});

/** Demo student's own order history — one active JEE 1-Year plus an earlier top-up. */
export const STUDENT_PAYMENTS: Payment[] = [
  (() => {
    const pkg = getPackage("PKG-JEE-1Y")!;
    const tax = Math.round(pkg.price * 0.18);
    return {
      id: "ORD-2026-00918",
      transactionId: "pay_NVX8K21LQ7TD",
      studentId: CURRENT_STUDENT.id,
      studentName: CURRENT_STUDENT.fullName,
      courseSlug: "jee",
      packageId: pkg.id,
      packageName: pkg.name,
      duration: pkg.duration,
      amount: pkg.originalPrice ?? pkg.price,
      discount: (pkg.originalPrice ?? pkg.price) - pkg.price,
      tax,
      total: pkg.price + tax,
      status: "successful",
      method: "UPI",
      date: "2026-05-18",
    } satisfies Payment;
  })(),
  (() => {
    const pkg = getPackage("PKG-CLASS12-3M")!;
    const tax = Math.round(pkg.price * 0.18);
    return {
      id: "ORD-2026-00742",
      transactionId: "pay_NVX4B90MRA1C",
      studentId: CURRENT_STUDENT.id,
      studentName: CURRENT_STUDENT.fullName,
      courseSlug: "class-12",
      packageId: pkg.id,
      packageName: pkg.name,
      duration: pkg.duration,
      amount: pkg.originalPrice ?? pkg.price,
      discount: (pkg.originalPrice ?? pkg.price) - pkg.price,
      tax,
      total: pkg.price + tax,
      status: "successful",
      method: "Card",
      date: "2026-04-02",
    } satisfies Payment;
  })(),
  {
    id: "ORD-2026-00701",
    transactionId: "pay_NVX2Z55PLK9F",
    studentId: CURRENT_STUDENT.id,
    studentName: CURRENT_STUDENT.fullName,
    courseSlug: "jee",
    packageId: "PKG-JEE-3M",
    packageName: "JEE Advantage — 3 Months",
    duration: "3M",
    amount: 6029,
    discount: 1530,
    tax: 810,
    total: 5309,
    status: "failed",
    method: "Netbanking",
    date: "2026-03-27",
  },
];

export const ENROLLMENTS: Enrollment[] = PAYMENTS.filter((p) => p.status === "successful").map(
  (payment, index) => {
    const pkg = getPackage(payment.packageId)!;
    const start = new Date(payment.date);
    const end = new Date(start);
    end.setMonth(end.getMonth() + pkg.durationMonths);
    return {
      id: `ENR-${String(2001 + index).padStart(5, "0")}`,
      studentId: payment.studentId,
      courseSlug: payment.courseSlug,
      packageId: payment.packageId,
      startDate: payment.date,
      endDate: end.toISOString().slice(0, 10),
      status: "active",
      paymentId: payment.id,
      testsTaken: (index % 4) + 1,
      testsTotal: pkg.tests,
    } satisfies Enrollment;
  },
);

export const STUDENT_ENROLLMENTS: Enrollment[] = [
  {
    id: "ENR-01844",
    studentId: CURRENT_STUDENT.id,
    courseSlug: "jee",
    packageId: "PKG-JEE-1Y",
    startDate: "2026-05-18",
    endDate: "2027-05-17",
    status: "active",
    paymentId: "ORD-2026-00918",
    testsTaken: 3,
    testsTotal: 30,
  },
  {
    id: "ENR-01702",
    studentId: CURRENT_STUDENT.id,
    courseSlug: "class-12",
    packageId: "PKG-CLASS12-3M",
    startDate: "2026-04-02",
    endDate: "2026-07-01",
    status: "expired",
    paymentId: "ORD-2026-00742",
    testsTaken: 8,
    testsTotal: 8,
  },
];

export const REVENUE_TREND = [
  { month: "Apr", revenue: 486000, purchases: 104 },
  { month: "May", revenue: 612000, purchases: 137 },
  { month: "Jun", revenue: 548000, purchases: 121 },
  { month: "Jul", revenue: 731000, purchases: 168 },
  { month: "Aug", revenue: 892000, purchases: 204 },
  { month: "Sep", revenue: 482000, purchases: 96 },
];

export const REGISTRATION_TREND = [
  { month: "Apr", registrations: 682, active: 512 },
  { month: "May", registrations: 914, active: 738 },
  { month: "Jun", registrations: 803, active: 651 },
  { month: "Jul", registrations: 1128, active: 932 },
  { month: "Aug", registrations: 1394, active: 1188 },
  { month: "Sep", registrations: 604, active: 498 },
];

export const PARTICIPATION_TREND = [
  { exam: "CBT-01", registered: 1148, appeared: 1042, absent: 106 },
  { exam: "CBT-02", registered: 1203, appeared: 1119, absent: 84 },
  { exam: "CBT-03", registered: 1256, appeared: 1188, absent: 68 },
  { exam: "CBT-04", registered: 1284, appeared: 0, absent: 0 },
];

export const COURSE_SPLIT = [
  { course: "JEE", students: 4218, color: "#ea4108" },
  { course: "NEET", students: 3906, color: "#10b981" },
  { course: "Class 12", students: 2314, color: "#0e1d4a" },
  { course: "Class 11", students: 1908, color: "#2563eb" },
  { course: "Devoter", students: 496, color: "#f59e0b" },
];
