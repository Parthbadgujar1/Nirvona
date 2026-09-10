"use client";

import Link from "next/link";
import {
  Activity, ArrowRight, Award, CalendarClock, CreditCard, FileCheck2, IdCard, KeyRound,
  ShoppingCart, TrendingUp, UserPlus, Users, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, LoadingState, Reveal } from "@/components/shared/states";
import {
  ChartCard, ChartLegend, DonutChart, ParticipationChart, RegistrationsChart, RevenueChart,
} from "@/components/charts";
import { useAsync } from "@/hooks/use-async";
import { adminService, adminData } from "@/services/admin.service";
import { formatCurrency, formatDate, formatNumber, relativeTime } from "@/lib/format";

const TODAY = new Date("2026-09-05T12:00:00Z");

const ACTIVITY_ICON = {
  purchase: ShoppingCart,
  exam: CalendarClock,
  result: Award,
  credential: KeyRound,
  "admit-card": IdCard,
  student: UserPlus,
} as const;

export function AdminDashboard() {
  const stats = useAsync(() => adminService.stats(), []);
  const activity = useAsync(() => adminService.activity(), []);
  const exams = useAsync(() => adminService.exams(), []);

  if (stats.status === "error") return <ErrorState onRetry={stats.reload} />;
  if (stats.status === "loading" || !stats.data) return <LoadingState label="Loading admin overview" />;

  const data = stats.data;
  const upcomingExams = (exams.data ?? []).filter((e) =>
    ["scheduled", "admit-card-available", "draft"].includes(e.status),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Platform health across students, purchases, examinations and evaluation."
        meta={
          <p className="text-xs text-ink-400">
            Data as of {formatDate("2026-09-05", "full")} · updated every 15 minutes
          </p>
        }
        actions={
          <>
            <Button asChild variant="secondary" size="md">
              <Link href="/admin/reports">Reports</Link>
            </Button>
            <Button asChild size="md">
              <Link href="/admin/exams">
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
            <RevenueChart data={adminData.REVENUE_TREND} height={280} />
          </ChartCard>
        </Reveal>

        <Reveal delay={0.05}>
          <ChartCard
            title="Student registrations"
            description="New registrations and how many converted to a paid enrolment."
          >
            <RegistrationsChart data={adminData.REGISTRATION_TREND} height={280} />
          </ChartCard>
        </Reveal>

        <Reveal delay={0.1}>
          <ChartCard
            title="Exam participation"
            description="Registered candidates versus those who appeared."
          >
            <ParticipationChart data={adminData.PARTICIPATION_TREND} height={280} />
          </ChartCard>
        </Reveal>

        <Reveal delay={0.15}>
          <ChartCard
            title="Students by program"
            description="Distribution of active students across the five programs."
          >
            <DonutChart
              data={adminData.COURSE_SPLIT.map((c) => ({
                name: c.course,
                value: c.students,
                color: c.color,
              }))}
              centerValue={formatNumber(
                adminData.COURSE_SPLIT.reduce((sum, c) => sum + c.students, 0),
              )}
              centerLabel="Students"
              height={240}
            />
            <ChartLegend
              className="mt-4 justify-center"
              items={adminData.COURSE_SPLIT.map((c) => ({
                label: c.course,
                color: c.color,
                value: formatNumber(c.students),
              }))}
            />
          </ChartCard>
        </Reveal>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        {/* Upcoming exams operations */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink-100 p-5">
            <div>
              <h2 className="font-display text-base font-semibold text-navy-900">
                Examination readiness
              </h2>
              <p className="mt-1 text-xs text-ink-500">
                Admit card and credential coverage for upcoming examinations.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/exams">
                All exams
                <ArrowRight />
              </Link>
            </Button>
          </div>

          {exams.status === "loading" ? (
            <div className="p-5">
              <LoadingState label="Loading examinations" />
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {upcomingExams.map((exam) => {
                const admitPct = exam.candidates ? (exam.admitCardsGenerated / exam.candidates) * 100 : 0;
                const credPct = exam.candidates ? (exam.credentialsAssigned / exam.candidates) * 100 : 0;
                return (
                  <li key={exam.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-navy-900">
                            {exam.id}
                          </span>
                          <StatusBadge kind="exam" status={exam.status} size="sm" />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink-500">
                          {formatDate(exam.date, "full")} · {formatNumber(exam.candidates)}{" "}
                          candidates
                        </p>
                      </div>
                      <Button asChild variant="secondary" size="xs">
                        <Link href={`/admin/exams/${exam.id}`}>Manage</Link>
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-ink-500">Admit cards</span>
                          <span className="font-semibold tabular text-navy-900">
                            {formatNumber(exam.admitCardsGenerated)} / {formatNumber(exam.candidates)}
                          </span>
                        </div>
                        <ProgressBar
                          value={admitPct}
                          size="sm"
                          tone={admitPct === 100 ? "success" : admitPct > 0 ? "ember" : "warning"}
                          label={`${exam.id} admit cards`}
                        />
                      </div>
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-ink-500">Credentials</span>
                          <span className="font-semibold tabular text-navy-900">
                            {formatNumber(exam.credentialsAssigned)} / {formatNumber(exam.candidates)}
                          </span>
                        </div>
                        <ProgressBar
                          value={credPct}
                          size="sm"
                          tone={credPct === 100 ? "success" : credPct > 0 ? "ember" : "warning"}
                          label={`${exam.id} credentials`}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Recent activity */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink-100 p-5">
            <div className="flex items-center gap-2.5">
              <Activity className="size-4 text-ember-600" aria-hidden />
              <h2 className="font-display text-base font-semibold text-navy-900">Recent activity</h2>
            </div>
            <Badge tone="neutral" size="sm">
              Live
            </Badge>
          </div>

          {activity.status === "loading" ? (
            <div className="p-5">
              <LoadingState label="Loading activity" />
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {(activity.data ?? []).map((item) => {
                const Icon = ACTIVITY_ICON[item.type];
                return (
                  <li key={item.id} className="flex gap-3 p-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-canvas text-ink-500">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-ink-700">
                        <span className="font-semibold text-navy-900">{item.actor}</span>{" "}
                        {item.action}{" "}
                        <span className="font-medium text-navy-900">{item.target}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {relativeTime(item.at, TODAY)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-ink-100 p-4">
            <Button asChild variant="secondary" size="sm" block>
              <Link href="/admin/notifications">View notification log</Link>
            </Button>
          </div>
        </Card>
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
                href={href}
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
