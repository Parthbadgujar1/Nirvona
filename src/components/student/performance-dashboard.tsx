"use client";

import Link from "next/link";
import {
  AlertTriangle, ArrowRight, ArrowUpRight, CheckCircle2, Clock, Lightbulb, Target,
  TrendingUp, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState, ErrorState, LoadingState, Reveal } from "@/components/shared/states";
import {
  AccuracyGauge, ChartCard, ChartLegend, DonutChart, RankTrendChart, ScoreTrendChart,
  SubjectComparisonChart,
} from "@/components/charts";
import { useAsync } from "@/hooks/use-async";
import { studentService } from "@/services/student.service";
import { cn } from "@/lib/utils";

export function PerformanceDashboard() {
  const performance = useAsync(() => studentService.performance(), []);
  const results = useAsync(() => studentService.results(), []);

  if (performance.status === "error") return <ErrorState onRetry={performance.reload} />;
  if (performance.status === "loading" || !performance.data) {
    return <LoadingState label="Building your analytics" />;
  }

  const data = performance.data;
  const latest = results.data?.[0];

  if (!latest) {
    return (
      <div className="space-y-6">
        <PageHeader title="Performance" />
        <EmptyState
          branded
          icon={TrendingUp}
          title="Analytics unlock after your first exam"
          description="Once you appear for a Nirvona CBT, this page fills with score trends, rank movement, subject comparison and topic-level diagnostics."
          action={{ label: "View upcoming exams", href: "/student/exams" }}
        />
      </div>
    );
  }

  const strengths = data.topics.filter((t) => t.accuracy >= 80);
  const weaknesses = data.topics.filter((t) => t.accuracy < 60);
  const middling = data.topics.filter((t) => t.accuracy >= 60 && t.accuracy < 80);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Analytics"
        description="Trends across every examination you have attempted, and a ranked view of what to fix next."
        breadcrumbs={[{ label: "Dashboard", href: "/student/dashboard" }, { label: "Performance" }]}
        actions={
          <Button asChild variant="secondary" size="md">
            <Link href="/student/results">
              <Trophy />
              All results
            </Link>
          </Button>
        }
      />

      {/* Headline insight */}
      <Reveal>
        <Card className="flex flex-col gap-4 border-l-4 border-l-ember-500 p-5 sm:flex-row sm:items-center">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ember-50 text-ember-600">
            <Lightbulb className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-semibold text-navy-900">
                Your score improved by {data.improvementPercent}% compared to your previous test
              </h2>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-success-50 px-2 py-0.5 text-2xs font-bold text-success-700">
                <ArrowUpRight className="size-3" aria-hidden />
                {data.improvementPercent}%
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{data.summary}</p>
          </div>
        </Card>
      </Reveal>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Latest score"
          value={`${latest.score} / ${latest.maxScore}`}
          hint={`${latest.examId} · ${latest.percentage}%`}
          icon={Target}
          accent="ember"
          delta={data.improvementPercent}
        />
        <StatCard
          label="Current rank"
          value={`#${latest.rank}`}
          hint={`of ${latest.totalCandidates.toLocaleString("en-IN")} candidates`}
          icon={Trophy}
          accent="navy"
        />
        <StatCard
          label="Percentile"
          numericValue={latest.percentile}
          decimals={1}
          hint={`Top ${(100 - latest.percentile).toFixed(1)}% of the cohort`}
          icon={TrendingUp}
          accent="royal"
        />
        <StatCard
          label="Accuracy"
          numericValue={latest.accuracy}
          decimals={1}
          suffix="%"
          hint={`${latest.correct} correct of ${latest.correct + latest.incorrect} attempted`}
          icon={CheckCircle2}
          accent="success"
        />
      </div>

      <Tabs defaultValue="trends">
        <TabsList variant="underline">
          <TabsTrigger variant="underline" value="trends">Trends</TabsTrigger>
          <TabsTrigger variant="underline" value="subjects">Subjects</TabsTrigger>
          <TabsTrigger variant="underline" value="topics">Topics</TabsTrigger>
          <TabsTrigger variant="underline" value="focus">What to fix</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard
              title="Score trend"
              description="Your score against the cohort average and the topper in each examination."
            >
              <ScoreTrendChart data={data.scoreTrend} height={300} />
            </ChartCard>

            <ChartCard
              title="Rank & percentile movement"
              description="Rank axis is inverted — a line moving up means an improving rank."
            >
              <RankTrendChart data={data.rankTrend} height={300} />
            </ChartCard>

            <ChartCard title="Accuracy trend" description="Correct answers as a share of attempts.">
              <div className="space-y-5">
                {data.accuracyTrend.map((point) => (
                  <div key={point.exam}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-navy-900">{point.exam}</span>
                      <span className="font-semibold tabular text-navy-900">{point.accuracy}%</span>
                    </div>
                    <ProgressBar
                      value={point.accuracy}
                      tone={point.accuracy >= 85 ? "success" : point.accuracy >= 70 ? "ember" : "warning"}
                      label={`${point.exam} accuracy`}
                    />
                  </div>
                ))}
                <p className="border-t border-ink-100 pt-4 text-sm leading-relaxed text-ink-500">
                  Accuracy above 85% under negative marking is the discipline threshold. Below 70%,
                  guessing is likely costing you more than it earns.
                </p>
              </div>
            </ChartCard>

            <ChartCard title="Time distribution" description="How your 180 minutes were spent in the last exam.">
              <DonutChart
                data={data.timeDistribution.map((d) => ({
                  name: d.subject,
                  value: d.minutes,
                  color: d.color,
                }))}
                centerValue={`${data.timeDistribution.reduce((s, d) => s + d.minutes, 0)}m`}
                centerLabel="Total"
                unit=" min"
                height={260}
              />
              <ChartLegend
                className="mt-4 justify-center"
                items={data.timeDistribution.map((d) => ({
                  label: d.subject,
                  color: d.color,
                  value: `${d.minutes}m`,
                }))}
              />
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="subjects">
          <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <ChartCard
              title="Subject comparison"
              description="Your percentage score against the cohort average and the topper."
            >
              <SubjectComparisonChart data={data.subjectComparison} height={320} />
            </ChartCard>

            <ChartCard title="Overall accuracy" description="Across your most recent examination.">
              <AccuracyGauge value={latest.accuracy} height={260} />
              <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-ink-100 pt-4 text-center">
                {[
                  { label: "Correct", value: latest.correct, tone: "text-success-600" },
                  { label: "Incorrect", value: latest.incorrect, tone: "text-danger-600" },
                  { label: "Skipped", value: latest.unattempted, tone: "text-ink-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-400">
                      {item.label}
                    </dt>
                    <dd className={cn("mt-0.5 font-display text-lg font-bold tabular", item.tone)}>
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </ChartCard>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {data.subjectComparison.map((subject) => {
              const gap = subject.topper - subject.you;
              return (
                <Card key={subject.subject} className="p-5">
                  <h3 className="font-display text-sm font-semibold text-navy-900">
                    {subject.subject}
                  </h3>
                  <p className="mt-3 font-display text-3xl font-bold tabular text-navy-900">
                    {subject.you}%
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    {subject.you - subject.average > 0 ? "+" : ""}
                    {subject.you - subject.average} points vs cohort average
                  </p>
                  <div className="mt-4 space-y-2">
                    <ProgressBar value={subject.you} size="sm" tone="ember" label={`${subject.subject} you`} />
                    <ProgressBar value={subject.average} size="xs" tone="royal" label={`${subject.subject} average`} />
                  </div>
                  <p className="mt-3 text-xs text-ink-500">
                    Gap to topper:{" "}
                    <span className={cn("font-semibold", gap > 20 ? "text-danger-600" : "text-navy-900")}>
                      {gap} points
                    </span>
                  </p>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="topics">
          <Card className="overflow-hidden">
            <div className="border-b border-ink-100 p-5">
              <h3 className="font-display text-base font-semibold text-navy-900">
                Topic performance
              </h3>
              <p className="mt-1 text-xs text-ink-500">
                Every topic you have been tested on, with accuracy, coverage and movement since the
                previous examination.
              </p>
            </div>
            <div className="nv-scroll overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50/70 text-left">
                    {["Topic", "Subject", "Accuracy", "Attempted", "Trend"].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="whitespace-nowrap px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {data.topics.map((topic) => (
                    <tr key={topic.topic} className="transition-colors hover:bg-ink-50/60">
                      <th scope="row" className="px-5 py-3.5 text-left font-medium text-navy-900">
                        {topic.topic}
                      </th>
                      <td className="px-5 py-3.5 text-ink-600">{topic.subject}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-24">
                            <ProgressBar
                              value={topic.accuracy}
                              size="sm"
                              tone={topic.accuracy >= 80 ? "success" : topic.accuracy >= 60 ? "warning" : "danger"}
                              label={`${topic.topic} accuracy`}
                            />
                          </div>
                          <span className="font-semibold tabular text-navy-900">
                            {topic.accuracy}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 tabular text-ink-600">
                        {topic.attempted} / {topic.total}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-2xs font-bold",
                            topic.trend > 0
                              ? "bg-success-50 text-success-700"
                              : topic.trend < 0
                                ? "bg-danger-50 text-danger-700"
                                : "bg-ink-100 text-ink-500",
                          )}
                        >
                          {topic.trend > 0 ? "+" : ""}
                          {topic.trend}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="focus">
          <div className="grid gap-5 lg:grid-cols-3">
            <FocusCard
              tone="success"
              icon={CheckCircle2}
              title="Strong areas"
              description="Hold these with light periodic revision — do not over-invest here."
              items={strengths.map((t) => ({ label: t.topic, meta: `${t.accuracy}% accuracy` }))}
              fallback={data.strengths.map((s) => ({ label: s, meta: "" }))}
            />
            <FocusCard
              tone="warning"
              icon={Clock}
              title="Improvement areas"
              description="Close to the threshold. Small, targeted practice converts these fastest."
              items={middling.map((t) => ({ label: t.topic, meta: `${t.accuracy}% accuracy` }))}
              fallback={data.improvements.map((s) => ({ label: s, meta: "" }))}
            />
            <FocusCard
              tone="danger"
              icon={AlertTriangle}
              title="Needs improvement"
              description="These are costing you the most marks. Start your next study block here."
              items={weaknesses.map((t) => ({ label: t.topic, meta: `${t.accuracy}% accuracy` }))}
              fallback={data.weaknesses.map((s) => ({ label: s, meta: "" }))}
            />
          </div>

          <Card className="mt-6 flex flex-col items-start gap-4 bg-navy-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-base font-semibold text-white">
                Your next examination is the test of this plan
              </p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/65">
                Work through the red list first, then the amber list. Your next result will show
                whether the accuracy on those topics moved.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href="/student/exams">
                View upcoming exam
                <ArrowRight />
              </Link>
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FocusCard({
  tone,
  icon: Icon,
  title,
  description,
  items,
  fallback,
}: {
  tone: "success" | "warning" | "danger";
  icon: typeof CheckCircle2;
  title: string;
  description: string;
  items: { label: string; meta: string }[];
  fallback: { label: string; meta: string }[];
}) {
  const list = items.length > 0 ? items : fallback;
  const tones = {
    success: { chip: "bg-success-50 text-success-600 ring-success-100", mark: "text-success-600", border: "border-l-success-500" },
    warning: { chip: "bg-warning-50 text-warning-600 ring-warning-100", mark: "text-warning-600", border: "border-l-warning-500" },
    danger: { chip: "bg-danger-50 text-danger-600 ring-danger-100", mark: "text-danger-600", border: "border-l-danger-500" },
  }[tone];

  return (
    <Card className={cn("border-l-4 p-5", tones.border)}>
      <span className={cn("flex size-10 items-center justify-center rounded-xl ring-1 ring-inset", tones.chip)}>
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold text-navy-900">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{description}</p>
      <ul className="mt-4 space-y-2.5">
        {list.map((item) => (
          <li key={item.label} className="flex items-start gap-2.5">
            <span className={cn("mt-0.5 shrink-0 text-sm font-bold", tones.mark)} aria-hidden>
              {tone === "success" ? "✓" : tone === "warning" ? "◐" : "⚠"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-navy-900">{item.label}</span>
              {item.meta && <span className="block text-xs text-ink-500">{item.meta}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
