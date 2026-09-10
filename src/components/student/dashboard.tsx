"use client";

import Link from "next/link";
import {
  ArrowRight, BookMarked, CalendarDays, Clock, Download, GraduationCap, IdCard, MapPin,
  Target, TrendingUp, Trophy, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState, LoadingState, ErrorState, Reveal } from "@/components/shared/states";
import { ScoreTrendChart, ChartCard } from "@/components/charts";
import { SubjectPerformance } from "./subject-performance";
import { useAsync } from "@/hooks/use-async";
import { studentService } from "@/services/student.service";
import { getPackage } from "@/data/packages";
import { getCourse } from "@/data/courses";
import { formatDate, daysUntil, relativeTime } from "@/lib/format";

const TODAY = new Date("2026-09-05");

export function StudentDashboard() {
  const student = useAsync(() => studentService.me(), []);
  const enrollments = useAsync(() => studentService.enrollments(), []);
  const exams = useAsync(() => studentService.exams(), []);
  const results = useAsync(() => studentService.results(), []);
  const performance = useAsync(() => studentService.performance(), []);
  const notifications = useAsync(() => studentService.notifications(), []);

  const loading = [student, enrollments, exams, results, performance].some(
    (r) => r.status === "loading",
  );
  const failed = [student, enrollments, exams, results].find((r) => r.status === "error");

  if (failed) {
    return (
      <ErrorState
        title="We could not load your dashboard"
        description="Your data is safe — this is a temporary problem loading it. Try again in a moment."
        onRetry={() => {
          student.reload();
          enrollments.reload();
          exams.reload();
          results.reload();
          performance.reload();
        }}
      />
    );
  }

  if (loading || !student.data) return <LoadingState label="Loading your dashboard" />;

  const activeEnrollment = enrollments.data?.find((e) => e.status === "active");
  const activePackage = activeEnrollment ? getPackage(activeEnrollment.packageId) : undefined;
  const activeCourse = activeEnrollment ? getCourse(activeEnrollment.courseSlug) : undefined;
  const upcoming = exams.data?.find((e) => new Date(e.date) >= TODAY);
  const latest = results.data?.[0];
  const unread = notifications.data?.filter((n) => !n.read) ?? [];

  const firstName = student.data.fullName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-[1.75rem]">
            Welcome back, {firstName} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            {upcoming
              ? `Your next examination is ${upcoming.id} on ${formatDate(upcoming.date)} — ${daysUntil(upcoming.date, TODAY)} days away.`
              : "No examinations scheduled right now. Your analytics are up to date."}
          </p>
        </div>
        {upcoming && (
          <Button asChild size="lg" className="shrink-0">
            <Link href="/student/admit-card">
              <IdCard />
              View Upcoming Exam
            </Link>
          </Button>
        )}
      </div>

      {unread.length > 0 && (
        <Alert
          tone="info"
          title={`${unread.length} new notification${unread.length === 1 ? "" : "s"}`}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/student/notifications">View all</Link>
            </Button>
          }
        >
          {unread[0].message}
        </Alert>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Program"
          value={activeCourse ? activeCourse.shortName : "None"}
          hint={activePackage ? activePackage.durationLabel : "No active enrolment"}
          icon={GraduationCap}
          accent="navy"
          href="/student/programs"
        />
        <StatCard
          label="Upcoming Exam"
          value={upcoming ? upcoming.id : "—"}
          hint={upcoming ? formatDate(upcoming.date) : "Nothing scheduled"}
          icon={CalendarDays}
          accent="royal"
          href="/student/exams"
        />
        <StatCard
          label="Latest Score"
          value={latest ? `${latest.score} / ${latest.maxScore}` : "—"}
          hint={latest ? `${latest.examId} · ${latest.percentage}%` : "No results yet"}
          icon={Target}
          accent="ember"
          delta={performance.data?.improvementPercent}
          href={latest ? `/student/results/${latest.examId}` : "/student/results"}
        />
        <StatCard
          label="Current Rank"
          value={latest ? `#${latest.rank}` : "—"}
          hint={latest ? `of ${latest.totalCandidates.toLocaleString("en-IN")} · ${latest.percentile} percentile` : "No rank yet"}
          icon={Trophy}
          accent="saffron"
          href="/student/performance"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        {/* Upcoming exam detail */}
        <div className="space-y-6">
          {upcoming ? (
            <Reveal>
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/70 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="size-4 text-ember-600" aria-hidden />
                    <h2 className="font-display text-base font-semibold text-navy-900">
                      Your next examination
                    </h2>
                  </div>
                  <StatusBadge kind="exam" status={upcoming.status} />
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-display text-2xl font-bold text-navy-900">
                      {upcoming.id}
                    </span>
                    <span className="text-sm text-ink-500">
                      {upcoming.name.split("· ")[1] ?? upcoming.name}
                    </span>
                    <Badge tone="ember" size="sm" className="ml-auto">
                      in {daysUntil(upcoming.date, TODAY)} days
                    </Badge>
                  </div>

                  <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Detail
                      icon={CalendarDays}
                      label="Exam date"
                      value={formatDate(upcoming.date, "full")}
                    />
                    <Detail icon={Clock} label="Reporting time" value={upcoming.reportingTime} />
                    <Detail icon={Clock} label="Exam time" value={upcoming.examTime} />
                    <Detail
                      icon={Users}
                      label="Candidates"
                      value={`${upcoming.candidates.toLocaleString("en-IN")} registered`}
                    />
                    <CentreDetail centreId={upcoming.centreId} />
                  </dl>

                  <div className="mt-6 flex flex-wrap gap-2 border-t border-ink-100 pt-5">
                    <Button asChild size="md">
                      <Link href="/student/admit-card">
                        <IdCard />
                        View Admit Card
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" size="md">
                      <Link href="/student/exams">All exams</Link>
                    </Button>
                    <Button asChild variant="ghost" size="md">
                      <Link href="/cbt">Exam-day instructions</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </Reveal>
          ) : (
            <EmptyState
              branded
              icon={CalendarDays}
              title="No upcoming examinations"
              description="You have no scheduled examinations right now. New dates are published in your portal as soon as the calendar is confirmed."
              action={{ label: "View exam calendar", href: "/student/exams" }}
            />
          )}

          {performance.data && (
            <Reveal delay={0.05}>
              <ChartCard
                title="Score trend"
                description="Your score against the cohort average and the topper."
                action={
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/student/performance">
                      Full analytics
                      <ArrowRight />
                    </Link>
                  </Button>
                }
              >
                <ScoreTrendChart data={performance.data.scoreTrend} height={260} />
              </ChartCard>
            </Reveal>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {activeEnrollment && activePackage && activeCourse ? (
            <Reveal delay={0.05}>
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-base font-semibold text-navy-900">
                    Active program
                  </h2>
                  <StatusBadge status={activeEnrollment.status} />
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 font-display text-xs font-bold text-navy-800">
                    {activeCourse.shortName.replace("Class ", "C")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold text-navy-900">
                      {activeCourse.name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {activePackage.durationLabel} · {activePackage.tests} examinations
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-ink-500">Examinations completed</span>
                    <span className="font-semibold tabular text-navy-900">
                      {activeEnrollment.testsTaken} / {activeEnrollment.testsTotal}
                    </span>
                  </div>
                  <ProgressBar
                    value={(activeEnrollment.testsTaken / activeEnrollment.testsTotal) * 100}
                    tone="ember"
                    label="Program progress"
                  />
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4 text-xs">
                  <div>
                    <dt className="text-ink-400">Valid from</dt>
                    <dd className="mt-0.5 font-semibold text-navy-900">
                      {formatDate(activeEnrollment.startDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-400">Valid until</dt>
                    <dd className="mt-0.5 font-semibold text-navy-900">
                      {formatDate(activeEnrollment.endDate)}
                    </dd>
                  </div>
                </dl>

                <Button asChild variant="secondary" size="sm" block className="mt-5">
                  <Link href="/student/programs">Manage programs</Link>
                </Button>
              </Card>
            </Reveal>
          ) : (
            <EmptyState
              branded
              icon={BookMarked}
              compact
              title="No active program"
              description="Enrol in a program to start appearing for Nirvona examinations."
              action={{ label: "Browse packages", href: "/packages" }}
            />
          )}

          {latest ? (
            <Reveal delay={0.1}>
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
                  <h2 className="font-display text-base font-semibold text-navy-900">
                    Latest result
                  </h2>
                  <StatusBadge status={latest.status} />
                </div>
                <div className="grid grid-cols-2 divide-x divide-ink-100 border-b border-ink-100">
                  {[
                    { label: "Score", value: `${latest.score}`, sub: `/ ${latest.maxScore}` },
                    { label: "Percentile", value: `${latest.percentile}`, sub: "" },
                  ].map((item) => (
                    <div key={item.label} className="p-5">
                      <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                        {item.label}
                      </p>
                      <p className="mt-1 font-display text-2xl font-bold tabular text-navy-900">
                        {item.value}
                        <span className="text-sm font-medium text-ink-400">{item.sub}</span>
                      </p>
                    </div>
                  ))}
                </div>
                <div className="p-5">
                  <p className="text-sm text-ink-600">
                    <span className="font-semibold text-navy-900">{latest.examId}</span> ·{" "}
                    {formatDate(latest.date)} · Rank #{latest.rank} of{" "}
                    {latest.totalCandidates.toLocaleString("en-IN")}
                  </p>
                  <Button asChild size="sm" block className="mt-4">
                    <Link href={`/student/results/${latest.examId}`}>
                      <TrendingUp />
                      View Detailed Analysis
                    </Link>
                  </Button>
                </div>
              </Card>
            </Reveal>
          ) : (
            <EmptyState
              icon={Trophy}
              compact
              title="No results available"
              description="Your first result will appear here within 72 hours of your first examination."
            />
          )}

          <Reveal delay={0.15}>
            <Card className="p-5">
              <h2 className="font-display text-base font-semibold text-navy-900">Quick actions</h2>
              <ul className="mt-4 space-y-2">
                {[
                  { label: "Download admit card", href: "/student/admit-card", icon: Download },
                  { label: "Check answer key", href: "/student/answer-key", icon: BookMarked },
                  { label: "Payments & receipts", href: "/student/payments", icon: Trophy },
                  { label: "Update profile", href: "/student/profile", icon: Users },
                ].map(({ label, href, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex items-center gap-3 rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:border-navy-200 hover:bg-ink-50"
                    >
                      <Icon className="size-4 text-ink-400" aria-hidden />
                      {label}
                      <ArrowRight className="ml-auto size-4 text-ink-300" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>
      </div>

      {latest && latest.subjects.length > 0 && (
        <Reveal delay={0.1}>
          <SubjectPerformance
            subjects={latest.subjects}
            title={`Subject performance · ${latest.examId}`}
            description={`Recorded on ${formatDate(latest.date)} · ${relativeTime(latest.date, TODAY)}`}
          />
        </Reveal>
      )}
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-canvas text-ink-500">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold leading-snug text-navy-900">{value}</dd>
      </div>
    </div>
  );
}

function CentreDetail({ centreId }: { centreId: string }) {
  const centre = useAsync(() => studentService.centre(centreId), [centreId]);
  return (
    <div className="flex items-start gap-3 sm:col-span-2">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-canvas text-ink-500">
        <MapPin className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">
          Examination centre
        </dt>
        <dd className="mt-0.5 text-sm font-semibold leading-snug text-navy-900">
          {centre.data ? centre.data.name : "Loading…"}
        </dd>
        {centre.data && (
          <dd className="mt-0.5 text-xs leading-relaxed text-ink-500">
            {centre.data.address}, {centre.data.city}, {centre.data.state} {centre.data.pincode}
          </dd>
        )}
      </div>
    </div>
  );
}
