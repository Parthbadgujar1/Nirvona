"use client";

import * as React from "react";
import { Award, Download, Target, TrendingDown, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ErrorState, LoadingState, Reveal } from "@/components/shared/states";
import {
  CentrePerformanceChart, ChartCard, ChartLegend, DonutChart, ParticipationChart,
  RegistrationsChart, RevenueChart, ScoreDistributionChart, SubjectComparisonChart,
} from "@/components/charts";
import { useAsync } from "@/hooks/use-async";
import { adminService, adminData } from "@/services/admin.service";
import { formatCurrency, formatNumber } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";

export function AnalyticsDashboard() {
  const results = useAsync(() => adminService.results(), []);
  const exams = useAsync(() => adminService.exams(), []);
  const [examId, setExamId] = React.useState("CBT-03");

  if (results.status === "error") return <ErrorState onRetry={results.reload} />;
  if (results.status === "loading" || !results.data) return <LoadingState label="Building analytics" />;

  const rows = results.data;
  const scores = rows.map((r) => r.score);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);
  const avgAccuracy = rows.reduce((sum, r) => sum + r.accuracy, 0) / rows.length;

  const subjectComparison = [
    { subject: "Physics", you: 58, average: 54, topper: 96 },
    { subject: "Chemistry", you: 64, average: 61, topper: 98 },
    { subject: "Mathematics", you: 51, average: 49, topper: 94 },
  ];

  const rankBands = [
    { name: "Top 100", value: 100, color: "#ea4108" },
    { name: "101–500", value: 400, color: "#f95c14" },
    { name: "501–1000", value: 500, color: "#2563eb" },
    { name: "1001+", value: 256, color: "#c6ccd8" },
  ];

  function exportAnalytics() {
    exportRows(
      timestampedName(`Nirvona_Analytics_${examId}`),
      [
        {
          Exam: examId,
          "Average Score": average.toFixed(1),
          "Highest Score": highest,
          "Lowest Score": lowest,
          "Average Accuracy": `${avgAccuracy.toFixed(1)}%`,
          "Candidates Evaluated": rows.length,
        },
      ],
      ["Exam", "Average Score", "Highest Score", "Lowest Score", "Average Accuracy", "Candidates Evaluated"].map(
        (key) => ({ key, header: key }),
      ),
    );
    toast.success("Analytics summary exported");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Cohort performance, score distribution, centre comparison and business metrics."
        actions={
          <>
            <div className="w-40">
              <label htmlFor="an-exam" className="sr-only">
                Examination
              </label>
              <Select id="an-exam" value={examId} onChange={(e) => setExamId(e.target.value)} className="h-10">
                {(exams.data ?? []).map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.id}
                  </option>
                ))}
              </Select>
            </div>
            <Button variant="secondary" size="md" onClick={exportAnalytics}>
              <Download />
              Export summary
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Average score" numericValue={average} decimals={1} icon={Target} accent="navy" hint="of 360" />
        <StatCard label="Highest score" numericValue={highest} icon={TrendingUp} accent="success" hint="of 360" />
        <StatCard label="Lowest score" numericValue={lowest} icon={TrendingDown} accent="danger" hint="of 360" />
        <StatCard label="Average accuracy" numericValue={avgAccuracy} decimals={1} suffix="%" icon={Target} accent="ember" />
        <StatCard label="Candidates" numericValue={1256} icon={Users} accent="royal" hint="appeared" />
        <StatCard label="Results published" numericValue={rows.filter((r) => r.status === "published").length} icon={Award} accent="saffron" />
      </div>

      <Tabs defaultValue="performance">
        <TabsList variant="underline">
          <TabsTrigger variant="underline" value="performance">Exam performance</TabsTrigger>
          <TabsTrigger variant="underline" value="centres">Centres</TabsTrigger>
          <TabsTrigger variant="underline" value="business">Business</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <div className="grid gap-6 xl:grid-cols-2">
            <Reveal>
              <ChartCard
                title="Score distribution"
                description={`How the ${examId} cohort is spread across mark bands.`}
              >
                <ScoreDistributionChart data={adminData.SCORE_DISTRIBUTION} height={300} />
              </ChartCard>
            </Reveal>

            <Reveal delay={0.05}>
              <ChartCard
                title="Rank distribution"
                description="Share of candidates in each rank band."
              >
                <DonutChart
                  data={rankBands}
                  centerValue={formatNumber(1256)}
                  centerLabel="Candidates"
                  height={260}
                />
                <ChartLegend
                  className="mt-4 justify-center"
                  items={rankBands.map((b) => ({
                    label: b.name,
                    color: b.color,
                    value: formatNumber(b.value),
                  }))}
                />
              </ChartCard>
            </Reveal>

            <Reveal delay={0.1}>
              <ChartCard
                title="Subject performance"
                description="Cohort average against the topper in each subject."
              >
                <SubjectComparisonChart data={subjectComparison} height={300} />
              </ChartCard>
            </Reveal>

            <Reveal delay={0.15}>
              <ChartCard
                title="Exam participation"
                description="Registered versus appeared across the CBT series."
              >
                <ParticipationChart data={adminData.PARTICIPATION_TREND} height={300} />
              </ChartCard>
            </Reveal>
          </div>

          <Card className="mt-6 p-5">
            <h3 className="font-display text-base font-semibold text-navy-900">
              Accuracy by subject
            </h3>
            <p className="mt-1 text-xs text-ink-500">
              Cohort accuracy — a low figure with high attempt rates usually indicates a
              difficulty-calibration issue rather than a preparation gap.
            </p>
            <ul className="mt-5 space-y-4">
              {[
                { subject: "Physics", accuracy: 58, attempts: 92 },
                { subject: "Chemistry", accuracy: 64, attempts: 96 },
                { subject: "Mathematics", accuracy: 51, attempts: 84 },
              ].map((item) => (
                <li key={item.subject}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-navy-900">{item.subject}</span>
                    <span className="tabular text-ink-500">
                      {item.accuracy}% accuracy · {item.attempts}% attempted
                    </span>
                  </div>
                  <ProgressBar
                    value={item.accuracy}
                    tone={item.accuracy >= 60 ? "success" : item.accuracy >= 50 ? "warning" : "danger"}
                    label={`${item.subject} accuracy`}
                  />
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="centres">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <ChartCard
              title="Centre performance"
              description="Average score per examination centre."
            >
              <CentrePerformanceChart data={adminData.CENTRE_PERFORMANCE} height={300} />
            </ChartCard>

            <Card className="overflow-hidden">
              <div className="border-b border-ink-100 p-5">
                <h3 className="font-display text-base font-semibold text-navy-900">
                  Centre comparison
                </h3>
                <p className="mt-1 text-xs text-ink-500">
                  Candidate volume, average score and the top score at each centre.
                </p>
              </div>
              <div className="nv-scroll overflow-x-auto">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 bg-ink-50/70 text-left">
                      {["Centre", "Candidates", "Average", "Top score"].map((h) => (
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
                    {adminData.CENTRE_PERFORMANCE.map((centre) => (
                      <tr key={centre.centre} className="transition-colors hover:bg-ink-50/60">
                        <th scope="row" className="px-5 py-3.5 text-left font-medium text-navy-900">
                          {centre.centre}
                        </th>
                        <td className="px-5 py-3.5 tabular text-ink-600">
                          {formatNumber(centre.candidates)}
                        </td>
                        <td className="px-5 py-3.5 tabular font-semibold text-navy-900">
                          {centre.average}
                        </td>
                        <td className="px-5 py-3.5 tabular text-ember-600">{centre.topScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business">
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Revenue" description="Monthly collected revenue across all programs.">
              <RevenueChart data={adminData.REVENUE_TREND} height={300} />
            </ChartCard>

            <ChartCard
              title="Registrations vs conversions"
              description="New registrations and how many became paid enrolments."
            >
              <RegistrationsChart data={adminData.REGISTRATION_TREND} height={300} />
            </ChartCard>

            <ChartCard title="Students by program" description="Distribution of active students.">
              <DonutChart
                data={adminData.COURSE_SPLIT.map((c) => ({
                  name: c.course,
                  value: c.students,
                  color: c.color,
                }))}
                centerValue={formatNumber(
                  adminData.COURSE_SPLIT.reduce((s, c) => s + c.students, 0),
                )}
                centerLabel="Students"
                height={260}
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

            <Card className="p-5">
              <h3 className="font-display text-base font-semibold text-navy-900">
                Revenue by program
              </h3>
              <ul className="mt-5 space-y-4">
                {adminData.COURSE_SPLIT.map((course) => {
                  const revenue = course.students * 1100;
                  const share =
                    (course.students /
                      adminData.COURSE_SPLIT.reduce((s, c) => s + c.students, 0)) *
                    100;
                  return (
                    <li key={course.course}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-navy-900">{course.course}</span>
                        <span className="tabular text-ink-600">
                          {formatCurrency(revenue, { compact: true })} · {share.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className="h-full rounded-full transition-[width] duration-700"
                          style={{ width: `${share}%`, backgroundColor: course.color }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
