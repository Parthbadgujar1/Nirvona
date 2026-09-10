"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, CheckCircle2, Circle, Clock, ListChecks, MinusCircle, Target,
  TrendingUp, Trophy, Users, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { Counter } from "@/components/shared/counter";
import { EmptyState, ErrorState, LoadingState, Reveal } from "@/components/shared/states";
import { SubjectPerformance } from "./subject-performance";
import { AccuracyGauge, ChartCard, DonutChart, SubjectComparisonChart, ChartLegend } from "@/components/charts";
import { useAsync } from "@/hooks/use-async";
import { studentService } from "@/services/student.service";
import { formatDate } from "@/lib/format";

export function ResultDetail({ examId }: { examId: string }) {
  const result = useAsync(() => studentService.result(examId), [examId]);
  const responses = useAsync(() => studentService.responses(examId), [examId]);
  const performance = useAsync(() => studentService.performance(), []);

  if (result.status === "error") return <ErrorState onRetry={result.reload} />;
  if (result.status === "loading") return <LoadingState label="Loading your result" />;

  if (!result.data) {
    return (
      <EmptyState
        branded
        icon={Trophy}
        title="Result not found"
        description={`We could not find a published result for ${examId}. If you appeared for this examination, the result may still be processing.`}
        action={{ label: "All results", href: "/student/results" }}
      />
    );
  }

  const data = result.data;
  const attempted = data.correct + data.incorrect;
  const marksLost = data.incorrect * 1;
  const potential = data.unattempted * 4;

  const responseDonut = [
    { name: "Correct", value: data.correct, color: "#10b981" },
    { name: "Incorrect", value: data.incorrect, color: "#ef4444" },
    { name: "Unattempted", value: data.unattempted, color: "#c6ccd8" },
  ];

  const timeData = data.subjects.map((s) => ({
    name: s.subject,
    value: s.timeSpentMin,
    color: s.color,
  }));

  const topics = responses.data
    ? Object.values(
        responses.data.rows.reduce<Record<string, { topic: string; correct: number; total: number }>>(
          (acc, row) => {
            acc[row.topic] ||= { topic: row.topic, correct: 0, total: 0 };
            acc[row.topic].total += 1;
            if (row.status === "correct") acc[row.topic].correct += 1;
            return acc;
          },
          {},
        ),
      )
        .map((t) => ({ ...t, accuracy: Math.round((t.correct / t.total) * 100) }))
        .sort((a, b) => b.accuracy - a.accuracy)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${data.examId} · Result`}
        description={`${data.examName.split("· ")[1] ?? data.examName} · conducted on ${formatDate(data.date, "full")}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/student/dashboard" },
          { label: "Results", href: "/student/results" },
          { label: data.examId },
        ]}
        actions={
          <>
            <Button asChild variant="secondary" size="md">
              <Link href={`/student/answer-key?exam=${data.examId}`}>
                <ListChecks />
                Answer key
              </Link>
            </Button>
            <Button asChild size="md">
              <Link href="/student/performance">
                <BarChart3 />
                View Detailed Analysis
              </Link>
            </Button>
          </>
        }
      />

      {/* Hero result card */}
      <Reveal>
        <Card className="overflow-hidden border-navy-900">
          <div className="relative overflow-hidden bg-brand-navy p-6 text-white sm:p-8">
            <div aria-hidden className="absolute inset-0 dot-backdrop opacity-[0.08]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone="onDark" size="sm">
                    Result published
                  </Badge>
                  <span className="text-xs text-white/50">{formatDate(data.date)}</span>
                </div>

                <div className="mt-5 flex items-end gap-3">
                  <motion.span
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="font-display text-6xl font-extrabold leading-none tabular text-white sm:text-7xl"
                  >
                    <Counter value={data.score} />
                  </motion.span>
                  <span className="pb-2 text-2xl font-medium text-white/40">
                    / {data.maxScore}
                  </span>
                </div>

                <div className="mt-5 max-w-md">
                  <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                    <span>Your score</span>
                    <span className="font-semibold text-white">{data.percentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/12">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.percentage}%` }}
                      transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-brand-ember"
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-2xs text-white/45">
                    <span>Cohort avg {data.averageScore}</span>
                    <span>Topper {data.topPerformerScore}</span>
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-3 gap-4">
                {[
                  { icon: Trophy, label: "Rank", value: `#${data.rank}`, sub: `of ${data.totalCandidates.toLocaleString("en-IN")}` },
                  { icon: TrendingUp, label: "Percentile", value: `${data.percentile}`, sub: `top ${(100 - data.percentile).toFixed(1)}%` },
                  { icon: Target, label: "Accuracy", value: `${data.accuracy}%`, sub: `${attempted} attempted` },
                ].map(({ icon: Icon, label, value, sub }) => (
                  <div
                    key={label}
                    className="rounded-xl bg-white/[0.07] p-4 ring-1 ring-inset ring-white/10"
                  >
                    <Icon className="size-4 text-saffron-300" aria-hidden />
                    <dt className="mt-2.5 text-2xs font-bold uppercase tracking-wider text-white/45">
                      {label}
                    </dt>
                    <dd className="mt-1 font-display text-2xl font-bold tabular text-white">
                      {value}
                    </dd>
                    <dd className="mt-0.5 text-2xs text-white/45">{sub}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Response summary strip */}
          <div className="grid divide-y divide-ink-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {[
              { icon: CheckCircle2, label: "Correct", value: data.correct, tone: "text-success-600", detail: `+${data.correct * 4} marks` },
              { icon: XCircle, label: "Incorrect", value: data.incorrect, tone: "text-danger-600", detail: `−${marksLost} marks` },
              { icon: MinusCircle, label: "Unattempted", value: data.unattempted, tone: "text-ink-400", detail: `${potential} marks left on the table` },
              { icon: Clock, label: "Time taken", value: data.timeTakenMin, tone: "text-royal-600", detail: `of ${data.timeTakenMin >= 180 ? 180 : 180} minutes` },
            ].map(({ icon: Icon, label, value, tone, detail }) => (
              <div key={label} className="border-b border-ink-100 p-5 lg:border-b-0">
                <div className="flex items-center gap-2">
                  <Icon className={`size-4 ${tone}`} aria-hidden />
                  <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">{label}</p>
                </div>
                <p className="mt-2 font-display text-2xl font-bold tabular text-navy-900">
                  <Counter value={value} />
                </p>
                <p className="mt-0.5 text-xs text-ink-500">{detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      <Tabs defaultValue="subjects">
        <TabsList variant="underline">
          <TabsTrigger variant="underline" value="subjects">
            Subject analysis
          </TabsTrigger>
          <TabsTrigger variant="underline" value="response">
            Response & time
          </TabsTrigger>
          <TabsTrigger variant="underline" value="topics">
            Topic performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
            <SubjectPerformance
              subjects={data.subjects}
              description={`Marks, accuracy and pace for each section of ${data.examId}.`}
            />
            {performance.data && (
              <ChartCard
                title="You vs the cohort"
                description="Percentage score in each subject compared with the average and the topper."
              >
                <SubjectComparisonChart data={performance.data.subjectComparison} height={300} />
              </ChartCard>
            )}
          </div>
        </TabsContent>

        <TabsContent value="response">
          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard title="Response breakdown" description={`${data.correct + data.incorrect + data.unattempted} questions`}>
              <DonutChart
                data={responseDonut}
                centerValue={`${data.accuracy}%`}
                centerLabel="Accuracy"
              />
              <ChartLegend
                className="mt-4 justify-center"
                items={responseDonut.map((d) => ({
                  label: d.name,
                  color: d.color,
                  value: String(d.value),
                }))}
              />
            </ChartCard>

            <ChartCard title="Accuracy" description="Correct answers as a share of attempted questions">
              <AccuracyGauge value={data.accuracy} height={240} />
              <p className="mt-2 text-center text-xs leading-relaxed text-ink-500">
                {data.correct} correct out of {attempted} attempted. Negative marking cost you{" "}
                <span className="font-semibold text-danger-600">{marksLost} marks</span>.
              </p>
            </ChartCard>

            <ChartCard title="Time distribution" description="Minutes spent per subject">
              <DonutChart
                data={timeData}
                centerValue={`${data.timeTakenMin}m`}
                centerLabel="Total"
                unit=" min"
              />
              <ChartLegend
                className="mt-4 justify-center"
                items={timeData.map((d) => ({
                  label: d.name,
                  color: d.color,
                  value: `${d.value}m`,
                }))}
              />
            </ChartCard>
          </div>

          <Card className="mt-6 p-5">
            <h3 className="font-display text-base font-semibold text-navy-900">Pacing analysis</h3>
            <ul className="mt-4 space-y-4">
              {data.subjects.map((subject) => {
                const perQuestion =
                  subject.timeSpentMin / (subject.correct + subject.incorrect + subject.unattempted);
                return (
                  <li key={subject.subject}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-navy-900">{subject.subject}</span>
                      <span className="tabular text-ink-500">
                        {subject.timeSpentMin} min · {perQuestion.toFixed(1)} min/question
                      </span>
                    </div>
                    <ProgressBar
                      value={(subject.timeSpentMin / data.timeTakenMin) * 100}
                      size="sm"
                      tone={perQuestion > 2.4 ? "danger" : perQuestion > 2 ? "warning" : "success"}
                      label={`${subject.subject} time share`}
                    />
                  </li>
                );
              })}
            </ul>
            <p className="mt-5 border-t border-ink-100 pt-4 text-sm leading-relaxed text-ink-600">
              A healthy pace on this paper is around 2 minutes per question. Sections shaded amber or
              red are consuming time that could be spent on your unattempted questions.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="topics">
          {topics.length === 0 ? (
            <EmptyState
              icon={Circle}
              title="Topic data is being processed"
              description="Topic-level analysis appears alongside the response sheet, usually within a few hours of the result."
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-5">
                <div>
                  <h3 className="font-display text-base font-semibold text-navy-900">
                    Topic performance
                  </h3>
                  <p className="mt-1 text-xs text-ink-500">
                    Accuracy by topic in {data.examId}, strongest first.
                  </p>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/student/answer-key?exam=${data.examId}`}>
                    Open answer key
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
              <ul className="divide-y divide-ink-100">
                {topics.map((topic) => (
                  <li key={topic.topic} className="flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy-900">{topic.topic}</p>
                      <p className="text-xs text-ink-500">
                        {topic.correct} of {topic.total} correct
                      </p>
                    </div>
                    <div className="w-32 shrink-0 sm:w-48">
                      <ProgressBar
                        value={topic.accuracy}
                        size="sm"
                        tone={topic.accuracy >= 75 ? "success" : topic.accuracy >= 50 ? "warning" : "danger"}
                        label={`${topic.topic} accuracy`}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right font-display text-sm font-bold tabular text-navy-900">
                      {topic.accuracy}%
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card className="flex flex-col items-start gap-4 bg-navy-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 size-5 shrink-0 text-saffron-300" aria-hidden />
          <div>
            <p className="font-display text-base font-semibold text-white">
              Where do you go from here?
            </p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/65">
              {performance.data?.summary ??
                "Open your performance analytics to see trends across every examination and a ranked list of what to revise next."}
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href="/student/performance">
            Open analytics
            <ArrowRight />
          </Link>
        </Button>
      </Card>
    </div>
  );
}
