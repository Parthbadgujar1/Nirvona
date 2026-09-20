"use client";

import { Link } from "react-router-dom";
import {
  ArrowRight, Award, CalendarClock, CreditCard, FileCheck2, IdCard, KeyRound, ShoppingCart, TrendingUp, Users, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, LoadingState, Reveal } from "@/components/shared/states";
import {
  ChartCard, ChartLegend, DonutChart, ParticipationChart, RegistrationsChart, RevenueChart,
} from "@/components/charts";
import { useAsync } from "@/hooks/use-async";
import { adminService } from "@/services/admin.service";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { ExamReadinessCard } from "@/components/admin/exam-readiness-card";
import { RecentActivityCard } from "@/components/admin/recent-activity-card";

/** Presentation-only - the backend returns course names/counts, not colors. */
const COURSE_COLORS = ["#ea4108", "#10b981", "#0e1d4a", "#2563eb", "#f59e0b", "#7c3aed"];


export function AdminDashboard() {
  const stats = useAsync(() => adminService.stats(), []);
  const activity = useAsync(() => adminService.activity(), []);
  const exams = useAsync(() => adminService.exams(), []);
  const revenueTrend = useAsync(() => adminService.revenueTrend(), []);
  const registrationTrend = useAsync(() => adminService.registrationTrend(), []);
  const participationTrend = useAsync(() => adminService.participationTrend(), []);
  const courseSplit = useAsync(() => adminService.courseSplit(), []);

  if (stats.status === "error") return <ErrorState onRetry={stats.reload} />;
  if (stats.status === "loading" || !stats.data) return <LoadingState label="Loading admin overview" />;

  const data = stats.data;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Platform health across students, purchases, examinations and evaluation."
        meta={
          <p className="text-xs text-ink-400">
            Data as of {formatDate(new Date().toISOString(), "full")} · updated every 15 minutes
          </p>
        }
        actions={
          <>
            <Button asChild variant="secondary" size="md">
              <Link to="/admin/reports">Reports</Link>
            </Button>
            <Button asChild size="md">
              <Link to="/admin/exams">
                <CalendarClock />
                Create Exam
              </Link>
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Total Students"
          numericValue={data.totalStudents}
          icon={Users}
          accent="navy"
          delta={data.deltas.totalStudents}
          hint="vs last month"
          href="/admin/students"
        />
        <StatCard
          label="Active Enrollments"
          numericValue={data.activeEnrollments}
          icon={FileCheck2}
          accent="royal"
          delta={data.deltas.activeEnrollments}
          hint="vs last month"
          href="/admin/purchases"
        />
        <StatCard
          label="Successful Purchases"
          numericValue={data.successfulPurchases}
          icon={ShoppingCart}
          accent="ember"
          delta={data.deltas.successfulPurchases}
          hint="vs last month"
          href="/admin/purchases"
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(data.revenue, { compact: true })}
          icon={Wallet}
          accent="success"
          delta={data.deltas.revenue}
          hint="this financial year"
          href="/admin/analytics"
        />
        <StatCard
          label="Upcoming Exams"
          numericValue={data.upcomingExams}
          icon={CalendarClock}
          accent="saffron"
          hint="next 45 days"
          href="/admin/exams"
        />
        <StatCard
          label="Pending Results"
          numericValue={data.pendingResults}
          icon={Award}
          accent="danger"
          delta={data.deltas.pendingResults}
          hint="awaiting publication"
          href="/admin/results"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Reveal>
          <ChartCard
            title="Revenue"
            description="Monthly collected revenue across all programs."
            action={
              <Badge tone="success" size="sm">
                <TrendingUp aria-hidden />
                {data.deltas.revenue}%
              </Badge>
            }
          >
            {revenueTrend.status === "loading" ? (
              <LoadingState label="Loading revenue" />
            ) : (
              <RevenueChart data={revenueTrend.data ?? []} height={280} />
            )}
          </ChartCard>
        </Reveal>

        <Reveal delay={0.05}>
          <ChartCard
            title="Student registrations"
            description="New registrations and how many converted to a paid enrolment."
          >
            {registrationTrend.status === "loading" ? (
              <LoadingState label="Loading registrations" />
            ) : (
              <RegistrationsChart data={registrationTrend.data ?? []} height={280} />
            )}
          </ChartCard>
        </Reveal>

        <Reveal delay={0.1}>
          <ChartCard
            title="Exam participation"
            description="Registered candidates versus those who appeared."
          >
            {participationTrend.status === "loading" ? (
              <LoadingState label="Loading exam participation" />
            ) : (participationTrend.data ?? []).length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-400">
                No exams with registered candidates yet.
              </p>
            ) : (
              <ParticipationChart data={participationTrend.data ?? []} height={280} />
            )}
          </ChartCard>
        </Reveal>

        <Reveal delay={0.15}>
          <ChartCard
            title="Students by program"
            description="Distribution of active students across the five programs."
          >
            {courseSplit.status === "loading" ? (
              <LoadingState label="Loading program distribution" />
            ) : (courseSplit.data ?? []).length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-400">
                No active enrollments yet.
              </p>
            ) : (
              <>
                <DonutChart
                  data={(courseSplit.data ?? []).map((c, i) => ({
                    name: c.course,
                    value: c.students,
                    color: COURSE_COLORS[i % COURSE_COLORS.length],
                  }))}
                  centerValue={formatNumber(
                    (courseSplit.data ?? []).reduce((sum, c) => sum + c.students, 0),
                  )}
                  centerLabel="Students"
                  height={240}
                />
                <ChartLegend
                  className="mt-4 justify-center"
                  items={(courseSplit.data ?? []).map((c, i) => ({
                    label: c.course,
                    color: COURSE_COLORS[i % COURSE_COLORS.length],
                    value: formatNumber(c.students),
                  }))}
                />
              </>
            )}
          </ChartCard>
        </Reveal>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <ExamReadinessCard exams={exams.data} loading={exams.status === "loading"} />
        <RecentActivityCard items={activity.data} loading={activity.status === "loading"} />
      </div>

      {/* Quick actions */}
      <Card className="p-5">
        <h2 className="font-display text-base font-semibold text-navy-900">Common tasks</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Upload Credentials", href: "/admin/exam-credentials", icon: KeyRound, tone: "ember" },
            { label: "Generate Admit Cards", href: "/admin/admit-cards", icon: IdCard, tone: "royal" },
            { label: "Publish Results", href: "/admin/results", icon: Award, tone: "success" },
            { label: "Export Purchases", href: "/admin/purchases", icon: CreditCard, tone: "navy" },
          ].map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <Link
                to={href}
                className="flex items-center gap-3 rounded-xl border border-ink-200 p-4 transition-all hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-navy-900">{label}</span>
                <ArrowRight className="ml-auto size-4 text-ink-300" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
