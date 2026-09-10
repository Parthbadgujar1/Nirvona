"use client";

import * as React from "react";
import Link from "next/link";
import {
  Award, CheckCircle2, Download, Eye, FileCheck2, FileSpreadsheet, Percent, Send, Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FilterBar, Pagination } from "@/components/shared/filters";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService } from "@/services/admin.service";
import { formatNumber } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";
import type { Result } from "@/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const WORKFLOW = [
  { title: "Student Responses", detail: "Imported and validated", icon: FileSpreadsheet, done: true },
  { title: "Answer Key", detail: "Validated and published", icon: FileCheck2, done: true },
  { title: "Evaluation", detail: "Scored per marking scheme", icon: CheckCircle2, done: true },
  { title: "Subject Score", detail: "Section-wise breakdown", icon: Award, done: true },
  { title: "Percentile", detail: "Normalised across cohort", icon: Percent, done: true },
  { title: "Rank", detail: "All-India rank assigned", icon: Trophy, done: true },
  { title: "Performance Analysis", detail: "Topic diagnostics generated", icon: Users, done: false },
  { title: "Publish Result", detail: "Released to candidates", icon: Send, done: false },
];

export function ResultsManager() {
  const results = useAsync(() => adminService.results(), []);
  const exams = useAsync(() => adminService.exams(), []);

  const [examId, setExamId] = React.useState("CBT-03");
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({ status: "all" });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [overrides, setOverrides] = React.useState<Record<string, Result["status"]>>({});
  const [publishOpen, setPublishOpen] = React.useState(false);

  if (results.status === "error") return <ErrorState onRetry={results.reload} />;
  if (results.status === "loading" || !results.data) return <LoadingState label="Loading results" />;

  const rows = results.data.map((r) => ({ ...r, status: overrides[r.id] ?? r.status }));

  const filtered = rows.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (search && !`${row.studentId} ${row.studentName}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const publishedCount = rows.filter((r) => r.status === "published").length;
  const processingCount = rows.filter((r) => r.status === "processing").length;
  const exam = exams.data?.find((e) => e.id === examId);
  const totalCandidates = exam?.candidates ?? 1256;

  const columns: Column<Result>[] = [
    {
      key: "studentName",
      header: "Student",
      primary: true,
      sortValue: (row) => row.studentName,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-900">{row.studentName}</p>
          <p className="font-mono text-2xs text-ink-500">{row.studentId}</p>
        </div>
      ),
    },
    {
      key: "score",
      header: "Score",
      align: "right",
      sortValue: (row) => row.score,
      cell: (row) => (
        <span className="tabular font-semibold text-navy-900">
          {row.score}
          <span className="text-xs font-normal text-ink-400">/{row.maxScore}</span>
        </span>
      ),
    },
    {
      key: "percentage",
      header: "Percentage",
      align: "right",
      sortValue: (row) => row.percentage,
      cell: (row) => <span className="tabular text-ink-700">{row.percentage}%</span>,
    },
    {
      key: "percentile",
      header: "Percentile",
      align: "right",
      sortValue: (row) => row.percentile,
      cell: (row) => <span className="tabular text-ink-700">{row.percentile}</span>,
    },
    {
      key: "rank",
      header: "Rank",
      align: "right",
      sortValue: (row) => row.rank,
      cell: (row) => (
        <span className={cn("tabular font-semibold", row.rank <= 100 ? "text-ember-600" : "text-navy-900")}>
          #{row.rank}
        </span>
      ),
    },
    {
      key: "accuracy",
      header: "Accuracy",
      align: "right",
      hideOnCard: true,
      sortValue: (row) => row.accuracy,
      cell: (row) => <span className="tabular text-ink-600">{row.accuracy}%</span>,
    },
    {
      key: "status",
      header: "Result status",
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button asChild variant="secondary" size="xs">
            <Link href={`/student/results/${row.examId}`}>
              <Eye />
              View
            </Link>
          </Button>
          {row.status !== "published" && (
            <Button
              size="xs"
              onClick={() => {
                setOverrides((prev) => ({ ...prev, [row.id]: "published" }));
                toast.success(`${row.studentName}'s result published`);
              }}
            >
              Publish
            </Button>
          )}
        </div>
      ),
    },
  ];

  function exportResults() {
    const source = selected.length ? filtered.filter((r) => selected.includes(r.id)) : filtered;
    exportRows(
      timestampedName(`Nirvona_Results_${examId}`),
      source.map((row) => ({
        "Student ID": row.studentId,
        "Student Name": row.studentName,
        Exam: row.examId,
        Score: row.score,
        "Max Score": row.maxScore,
        Percentage: row.percentage,
        Percentile: row.percentile,
        Rank: row.rank,
        "Total Candidates": row.totalCandidates,
        Accuracy: row.accuracy,
        Correct: row.correct,
        Incorrect: row.incorrect,
        Unattempted: row.unattempted,
        Status: row.status,
      })),
      [
        "Student ID", "Student Name", "Exam", "Score", "Max Score", "Percentage", "Percentile",
        "Rank", "Total Candidates", "Accuracy", "Correct", "Incorrect", "Unattempted", "Status",
      ].map((key) => ({ key, header: key })),
    );
    toast.success(`${source.length} results exported`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Results"
        description="Evaluate, review and publish examination results with rank and percentile."
        actions={
          <>
            <Button variant="secondary" size="md" onClick={exportResults}>
              <Download />
              Export {selected.length > 0 ? `(${selected.length})` : "all"}
            </Button>
            <Button size="md" onClick={() => setPublishOpen(true)}>
              <Send />
              Publish Results
            </Button>
          </>
        }
      />

      {/* Workflow */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-navy-900">
              Evaluation workflow · {examId}
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              Every stage must complete before results can be released to candidates.
            </p>
          </div>
          <div className="w-full sm:w-56">
            <label htmlFor="res-exam" className="sr-only">
              Examination
            </label>
            <Select
              id="res-exam"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="h-10"
            >
              {(exams.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <li
                key={stage.title}
                className={cn(
                  "relative rounded-xl border p-4",
                  stage.done ? "border-success-500/30 bg-success-50/40" : "border-ink-200 bg-white",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg",
                      stage.done ? "bg-success-500 text-white" : "bg-ink-100 text-ink-400",
                    )}
                  >
                    {stage.done ? (
                      <CheckCircle2 className="size-4" aria-hidden />
                    ) : (
                      <Icon className="size-3.5" aria-hidden />
                    )}
                  </span>
                  <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                    Stage {index + 1}
                  </span>
                </div>
                <p className="mt-2.5 font-display text-sm font-semibold text-navy-900">
                  {stage.title}
                </p>
                <p className="mt-0.5 text-xs text-ink-500">{stage.detail}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 border-t border-ink-100 pt-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-navy-900">Pipeline completion</span>
            <span className="tabular text-ink-500">
              {WORKFLOW.filter((s) => s.done).length} of {WORKFLOW.length} stages
            </span>
          </div>
          <ProgressBar
            value={(WORKFLOW.filter((s) => s.done).length / WORKFLOW.length) * 100}
            tone="ember"
            label="Evaluation pipeline completion"
          />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total candidates" numericValue={totalCandidates} icon={Users} accent="navy" />
        <StatCard
          label="Evaluated"
          numericValue={rows.length}
          icon={CheckCircle2}
          accent="royal"
          hint="in this sample"
        />
        <StatCard label="Pending" numericValue={processingCount} icon={Award} accent="ember" />
        <StatCard label="Results published" numericValue={publishedCount} icon={Trophy} accent="success" />
      </div>

      {processingCount > 0 && (
        <Alert tone="warning" title={`${processingCount} results are still processing`}>
          Results in the processing state have not completed topic-level analysis. Publishing them
          now would release a score without the performance report.
        </Alert>
      )}

      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search student name or ID…"
        values={filters}
        resultCount={filtered.length}
        onChange={(id, value) => {
          setFilters((f) => ({ ...f, [id]: value }));
          setPage(1);
        }}
        onReset={() => {
          setFilters({ status: "all" });
          setSearch("");
        }}
        filters={[
          {
            id: "status",
            label: "Status",
            options: [
              { label: "Published", value: "published" },
              { label: "Processing", value: "processing" },
            ],
          },
        ]}
      >
        {selected.length > 0 && (
          <Badge tone="navy" size="sm">
            {selected.length} selected
          </Badge>
        )}
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No results match these filters"
          description="Adjust the filters, or import the response file for this examination."
          action={{ label: "Clear filters", onClick: () => { setFilters({ status: "all" }); setSearch(""); } }}
          secondaryAction={{ label: "Import responses", href: "/admin/responses" }}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={paged}
            rowKey={(row) => row.id}
            selectable
            selected={selected}
            onSelectedChange={setSelected}
            stickyFirst
            caption="Candidate results"
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title="Publish results to candidates?"
        description="Publishing releases scores, ranks, percentiles and performance analysis to every selected candidate, and triggers result notifications. This is visible to students immediately."
        confirmLabel="Publish results"
        onConfirm={() => {
          const ids = selected.length ? selected : filtered.map((r) => r.id);
          setOverrides((prev) => {
            const next = { ...prev };
            ids.forEach((id) => {
              next[id] = "published";
            });
            return next;
          });
          setSelected([]);
          toast.success(`${formatNumber(ids.length)} results published`, {
            description: "Result notifications have been queued on WhatsApp, SMS and email.",
          });
        }}
        details={
          <div className="rounded-xl border border-ink-200 bg-canvas p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Examination</span>
              <span className="font-semibold text-navy-900">{examId}</span>
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-ink-500">Results to publish</span>
              <span className="font-semibold tabular text-navy-900">
                {formatNumber(selected.length || filtered.length)}
              </span>
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-ink-500">Still processing</span>
              <span className="font-semibold tabular text-warning-600">{processingCount}</span>
            </div>
          </div>
        }
      />
    </div>
  );
}
