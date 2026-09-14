"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Target, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState, ErrorState, LoadingState, StaggerGroup, StaggerItem } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { studentService } from "@/services/student.service";
import { formatDate } from "@/lib/format";

export function ResultsList() {
  const results = useAsync(() => studentService.results(), []);
  const performance = useAsync(() => studentService.performance(), []);

  if (results.status === "error") return <ErrorState onRetry={results.reload} />;
  if (results.status === "loading" || !results.data) return <LoadingState label="Loading your results" />;

  if (results.data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Results"
          breadcrumbs={[{ label: "Dashboard", href: "/student/dashboard" }, { label: "Results" }]}
        />
        <EmptyState
          branded
          icon={Trophy}
          title="No results available"
          description="Your results appear here within 72 hours of each examination, together with your rank, percentile and full performance analysis."
          action={{ label: "View upcoming exams", href: "/student/exams" }}
        />
      </div>
    );
  }

  const best = results.data.reduce((a, b) => (b.score > a.score ? b : a));
  const bestRank = results.data.reduce((a, b) => (b.rank < a.rank ? b : a));
  const avgAccuracy =
    results.data.reduce((sum, r) => sum + r.accuracy, 0) / results.data.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Results"
        description="Every published result, newest first. Open any result for the full question-level analysis."
        breadcrumbs={[{ label: "Dashboard", href: "/student/dashboard" }, { label: "Results" }]}
        actions={
          <Button asChild variant="navy" size="md">
            <Link href="/student/performance">
              <BarChart3 />
              Performance analytics
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Exams attempted" numericValue={results.data.length} icon={Trophy} accent="navy" />
        <StatCard
          label="Best score"
          value={`${best.score} / ${best.maxScore}`}
          hint={best.examId}
          icon={Target}
          accent="ember"
        />
        <StatCard
          label="Best rank"
          value={`#${bestRank.rank}`}
          hint={`${bestRank.examId} · percentile ${bestRank.percentile}`}
          icon={Trophy}
          accent="saffron"
        />
        <StatCard
          label="Average accuracy"
          numericValue={avgAccuracy}
          decimals={1}
          suffix="%"
          icon={TrendingUp}
          accent="success"
          delta={performance.data?.improvementPercent}
        />
      </div>

      <StaggerGroup className="space-y-4">
        {results.data.map((result) => (
          <StaggerItem key={result.id}>
            <Card interactive className="overflow-hidden">
              <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-display text-base font-bold text-navy-900">
                      {result.examId}
                    </span>
                    <StatusBadge status={result.status} size="sm" />
                  </div>
                  <p className="mt-1 truncate text-sm text-ink-500">
                    {result.examName.split("· ")[1] ?? result.examName} · {formatDate(result.date)}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:w-[34rem]">
                  {[
                    { label: "Score", value: `${result.score}`, sub: `/${result.maxScore}` },
                    { label: "Percentage", value: `${result.percentage}%`, sub: "" },
                    { label: "Rank", value: `#${result.rank}`, sub: `/${result.totalCandidates}` },
                    { label: "Percentile", value: `${result.percentile}`, sub: "" },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                        {item.label}
                      </dt>
                      <dd className="mt-0.5 font-display text-lg font-bold tabular text-navy-900">
                        {item.value}
                        <span className="text-xs font-medium text-ink-400">{item.sub}</span>
                      </dd>
                    </div>
                  ))}
                </dl>

                <Button asChild size="md" className="shrink-0">
                  <Link href={`/student/results/${result.examId}`}>
                    View Detailed Analysis
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </Card>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  );
}
