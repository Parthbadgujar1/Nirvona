import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { SiteLayout } from "@/layouts/SiteLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { FlowLayout } from "@/layouts/FlowLayout";
import { LoadingState } from "@/components/shared/states";
import { ScrollToTop } from "@/components/shared/scroll-to-top";

import HomePage from "@/pages/site/home";
import AboutPage from "@/pages/site/about";
import CbtPage from "@/pages/site/cbt";
import ContactPage from "@/pages/site/contact";
import CoursesPage from "@/pages/site/courses";
import CourseDetailPage from "@/pages/site/course-detail";
import FaqsPage from "@/pages/site/faqs";
import PackagesPage from "@/pages/site/packages";
import PackageDetailPage from "@/pages/site/package-detail";

import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";

import CheckoutPage from "@/pages/flow/checkout";
import PaymentSuccessPage from "@/pages/flow/payment-success";
import PaymentFailedPage from "@/pages/flow/payment-failed";

import NotFoundPage from "@/pages/not-found";

// The admin and student portals (data tables, charts, forms) are the
// bulk of the app's JS - most visitors only ever see the public
// marketing site or one portal, never both, so there's no reason to
// ship either portal's bundle to a visitor browsing course pages.
// Lazy-loading everything past these two layouts splits them into
// separate chunks Vite only fetches once a route under /admin or
// /student is actually visited (see the build's chunk-size warning
// this fixes - a single ~2MB bundle otherwise).
const AdminLayout = lazy(() => import("@/layouts/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const StudentLayout = lazy(() => import("@/layouts/StudentLayout").then((m) => ({ default: m.StudentLayout })));

const AdminDashboardPage = lazy(() => import("@/pages/admin/dashboard"));
const AdminStudentsPage = lazy(() => import("@/pages/admin/students"));
const AdminPurchasesPage = lazy(() => import("@/pages/admin/purchases"));
const AdminCoursesPage = lazy(() => import("@/pages/admin/courses"));
const AdminPackagesPage = lazy(() => import("@/pages/admin/packages"));
const AdminExamsPage = lazy(() => import("@/pages/admin/exams"));
const AdminExamDetailPage = lazy(() => import("@/pages/admin/exam-detail"));
const AdminExamCentresPage = lazy(() => import("@/pages/admin/exam-centres"));
const AdminExamCredentialsPage = lazy(() => import("@/pages/admin/exam-credentials"));
const AdminAdmitCardsPage = lazy(() => import("@/pages/admin/admit-cards"));
const AdminAnswerKeysPage = lazy(() => import("@/pages/admin/answer-keys"));
const AdminResponsesPage = lazy(() => import("@/pages/admin/responses"));
const AdminResultsPage = lazy(() => import("@/pages/admin/results"));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/analytics"));
const AdminReportsPage = lazy(() => import("@/pages/admin/reports"));
const AdminNotificationsPage = lazy(() => import("@/pages/admin/notifications"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/settings"));

const StudentDashboardPage = lazy(() => import("@/pages/student/dashboard"));
const StudentProgramsPage = lazy(() => import("@/pages/student/programs"));
const StudentExamsPage = lazy(() => import("@/pages/student/exams"));
const StudentAdmitCardPage = lazy(() => import("@/pages/student/admit-card"));
const StudentResultsPage = lazy(() => import("@/pages/student/results"));
const StudentResultDetailPage = lazy(() => import("@/pages/student/result-detail"));
const StudentAnswerKeyPage = lazy(() => import("@/pages/student/answer-key"));
const StudentPerformancePage = lazy(() => import("@/pages/student/performance"));
const StudentPaymentsPage = lazy(() => import("@/pages/student/payments"));
const StudentNotificationsPage = lazy(() => import("@/pages/student/notifications"));
const StudentSupportPage = lazy(() => import("@/pages/student/support"));
const StudentProfilePage = lazy(() => import("@/pages/student/profile"));

/**
 * Route table replacing the Next.js App Router's file-based routing
 * (src/app/**) - every route below corresponds 1:1 to a former
 * src/app/**\/page.tsx, and every layout route to a former layout.tsx.
 * Route groups like (site)/(auth)/(flow) didn't affect the URL in
 * Next.js (parens = organization only) and don't need an equivalent
 * here; their shared chrome is just a nested layout route instead.
 */
export function App() {
  return (
    <Suspense fallback={<LoadingState label="Loading" />}>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/cbt" element={<CbtPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
          <Route path="/faqs" element={<FaqsPage />} />
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/packages/:id" element={<PackageDetailPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<FlowLayout />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failed" element={<PaymentFailedPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="purchases" element={<AdminPurchasesPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="packages" element={<AdminPackagesPage />} />
          <Route path="exams" element={<AdminExamsPage />} />
          <Route path="exams/:id" element={<AdminExamDetailPage />} />
          <Route path="exam-centres" element={<AdminExamCentresPage />} />
          <Route path="exam-credentials" element={<AdminExamCredentialsPage />} />
          <Route path="admit-cards" element={<AdminAdmitCardsPage />} />
          <Route path="answer-keys" element={<AdminAnswerKeysPage />} />
          <Route path="responses" element={<AdminResponsesPage />} />
          <Route path="results" element={<AdminResultsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="programs" element={<StudentProgramsPage />} />
          <Route path="exams" element={<StudentExamsPage />} />
          <Route path="admit-card" element={<StudentAdmitCardPage />} />
          <Route path="results" element={<StudentResultsPage />} />
          <Route path="results/:id" element={<StudentResultDetailPage />} />
          <Route path="answer-key" element={<StudentAnswerKeyPage />} />
          <Route path="performance" element={<StudentPerformancePage />} />
          <Route path="payments" element={<StudentPaymentsPage />} />
          <Route path="notifications" element={<StudentNotificationsPage />} />
          <Route path="support" element={<StudentSupportPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
