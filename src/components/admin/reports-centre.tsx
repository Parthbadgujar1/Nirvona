"use client";

import * as React from "react";
import { Download, Eye, FileBarChart, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { FilterBar } from "@/components/shared/filters";
import { EmptyState, ErrorState, LoadingState, StaggerGroup, StaggerItem } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService, adminData } from "@/services/admin.service";
import { formatDate, formatNumber } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";

interface Report {
  id: string;
  name: string;
  description: string;
  records: number;
  updated: string;
  category: string;
}

const COLUMN_MAP: Record<string, string[]> = {
  "RPT-01": ["Student ID", "Student Name", "Mobile", "Email", "Class", "School", "City", "State", "Course", "Enrollment Date", "Status"],
  "RPT-02": ["Order ID", "Student ID", "Student Name", "Course", "Package", "Duration", "Amount", "Discount", "GST", "Total", "Purchase Date", "Status"],
  "RPT-03": ["Order ID", "Transaction ID", "Student ID", "Amount", "Method", "Payment Date", "Status", "Settlement"],
  "RPT-04": ["Exam", "Centre", "Registered", "Appeared", "Absent", "Attendance %"],
  "RPT-05": ["Student ID", "Student Name", "Exam", "Roll Number", "Seat No", "Status", "Generated At", "Published At"],
  "RPT-06": ["Student ID", "Student Name", "Exam", "Exam Login ID", "Status", "Assigned At"],
  "RPT-07": ["Student ID", "Student Name", "Exam", "Score", "Percentage", "Percentile", "Rank", "Accuracy", "Status"],
  "RPT-08": ["Centre", "Code", "City", "Candidates", "Average Score", "Top Score", "Utilisation %"],
};

export function ReportsCentre() {
  const reports = useAsync(() => adminService.reports(), []);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({ category: "all" });
  const [preview, setPreview] = React.useState<Report | null>(null);
  const [generating, setGenerating] = React.useState<string | null>(null);

  if (reports.status === "error") return <ErrorState onRetry={reports.reload} />;
  if (reports.status === "loading" || !reports.data) return <LoadingState label="Loading report centre" />;

  const all = reports.data as Report[];
  const categories = Array.from(new Set(all.map((r) => r.category)));

  const filtered = all.filter((report) => {
    if (filters.category !== "all" && report.category !== filters.category) return false;
    if (search && !`${report.name} ${report.description}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  async function download(report: Report) {
    setGenerating(report.id);
    await new Promise((r) => setTimeout(r, 1100));
    const columns = COLUMN_MAP[report.id] ?? ["Column"];
    const sample = buildSample(report.id, columns);
    exportRows(
      timestampedName(`Nirvona_${report.name.replace(/\s+/g, "_")}`),
      sample,
      columns.map((key) => ({ key, header: key })),
    );
    setGenerating(null);
    toast.success(`${report.name} downloaded`, {
      description: `${formatNumber(sample.length)} rows exported from ${formatNumber(report.records)} total records.`,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export operational reports across students, finance, examinations and evaluation."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available reports" numericValue={all.length} icon={FileBarChart} accent="navy" />
        <StatCard label="Categories" numericValue={categories.length} icon={FileSpreadsheet} accent="royal" />
        <StatCard
          label="Total records"
          numericValue={all.reduce((sum, r) => sum + r.records, 0)}
          icon={FileSpreadsheet}
          accent="ember"
        />
        <StatCard label="Last refresh" value={formatDate("2026-09-05")} icon={FileBarChart} accent="success" />
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search reports…"
        values={filters}
        resultCount={filtered.length}
        onChange={(id, value) => setFilters((f) => ({ ...f, [id]: value }))}
        onReset={() => {
          setFilters({ category: "all" });
          setSearch("");
        }}
        filters={[
          {
            id: "category",
            label: "Category",
            options: categories.map((c) => ({ label: c, value: c })),
          },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title="No reports match this search"
          description="Try a different term or clear the category filter."
          action={{
            label: "Clear filters",
            onClick: () => {
              setFilters({ category: "all" });
              setSearch("");
            },
          }}
        />
      ) : (
        <StaggerGroup className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((report) => (
            <StaggerItem key={report.id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-navy-100">
                    <FileBarChart className="size-[18px]" aria-hidden />
                  </span>
                  <Badge tone="neutral" size="sm">
                    {report.category}
                  </Badge>
                </div>

                <h2 className="mt-4 font-display text-base font-semibold text-navy-900">
                  {report.name}
                </h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-500">
                  {report.description}
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4 text-xs">
                  <div>
                    <dt className="text-ink-400">Records</dt>
                    <dd className="mt-0.5 font-semibold tabular text-navy-900">
                      {formatNumber(report.records)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-400">Updated</dt>
                    <dd className="mt-0.5 font-semibold text-navy-900">
                      {formatDate(report.updated)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => setPreview(report)}>
                    <Eye />
                    View
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    loading={generating === report.id}
                    onClick={() => download(report)}
                  >
                    <Download />
                    Export
                  </Button>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent size="lg">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle>{preview.name}</DialogTitle>
                <DialogDescription>{preview.description}</DialogDescription>
              </DialogHeader>
              <DialogBody>
                <dl className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Records", value: formatNumber(preview.records) },
                    { label: "Category", value: preview.category },
                    { label: "Last updated", value: formatDate(preview.updated) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-ink-200 bg-canvas p-4">
                      <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                        {item.label}
                      </dt>
                      <dd className="mt-1 font-display text-lg font-bold text-navy-900">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5">
                  <h3 className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                    Columns in this report
                  </h3>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {(COLUMN_MAP[preview.id] ?? []).map((column) => (
                      <li
                        key={column}
                        className="rounded-md bg-canvas px-2 py-1 font-mono text-2xs text-ink-600"
                      >
                        {column}
                      </li>
                    ))}
                  </ul>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setPreview(null)}>
                  Close
                </Button>
                <Button loading={generating === preview.id} onClick={() => download(preview)}>
                  <Download />
                  Download report
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Builds an export sample from the live mock data so downloads are never empty. */
function buildSample(reportId: string, columns: string[]): Record<string, unknown>[] {
  switch (reportId) {
    case "RPT-01":
      return adminData.STUDENTS.map((s) => ({
        "Student ID": s.id,
        "Student Name": s.fullName,
        Mobile: s.mobile,
        Email: s.email,
        Class: s.className,
        School: s.school,
        City: s.city,
        State: s.state,
        Course: s.examPreference[0],
        "Enrollment Date": s.enrolledAt,
        Status: s.status,
      }));
    case "RPT-02":
    case "RPT-03":
      return adminData.PAYMENTS.map((p) => ({
        "Order ID": p.id,
        "Transaction ID": p.transactionId,
        "Student ID": p.studentId,
        "Student Name": p.studentName,
        Course: p.courseSlug,
        Package: p.packageName,
        Duration: p.duration,
        Amount: p.amount,
        Discount: p.discount,
        GST: p.tax,
        Total: p.total,
        Method: p.method,
        "Purchase Date": p.date,
        "Payment Date": p.date,
        Status: p.status,
        Settlement: p.status === "successful" ? "Settled" : "—",
      }));
    case "RPT-04":
      return adminData.PARTICIPATION_TREND.map((row) => ({
        Exam: row.exam,
        Centre: "All centres",
        Registered: row.registered,
        Appeared: row.appeared,
        Absent: row.absent,
        "Attendance %": row.registered
          ? `${((row.appeared / row.registered) * 100).toFixed(1)}%`
          : "—",
      }));
    case "RPT-05":
      return adminData.ADMIT_CARDS.map((a) => ({
        "Student ID": a.studentId,
        "Student Name": adminData.STUDENTS.find((s) => s.id === a.studentId)?.fullName ?? "",
        Exam: a.examId,
        "Roll Number": a.rollNumber,
        "Seat No": a.seatNo,
        Status: a.status,
        "Generated At": a.generatedAt ?? "",
        "Published At": a.publishedAt ?? "",
      }));
    case "RPT-06":
      return adminData.EXAM_CREDENTIALS.map((c) => ({
        "Student ID": c.studentId,
        "Student Name": c.studentName,
        Exam: c.examId,
        "Exam Login ID": c.loginId,
        Status: c.status,
        "Assigned At": c.assignedAt ?? "",
      }));
    case "RPT-07":
      return adminData.COHORT_RESULTS.map((r) => ({
        "Student ID": r.studentId,
        "Student Name": r.studentName,
        Exam: r.examId,
        Score: r.score,
        Percentage: r.percentage,
        Percentile: r.percentile,
        Rank: r.rank,
        Accuracy: r.accuracy,
        Status: r.status,
      }));
    case "RPT-08":
      return adminData.EXAM_CENTRES.map((c) => {
        const perf = adminData.CENTRE_PERFORMANCE.find((p) => p.centre === c.city);
        return {
          Centre: c.name,
          Code: c.code,
          City: c.city,
          Candidates: perf?.candidates ?? 0,
          "Average Score": perf?.average ?? 0,
          "Top Score": perf?.topScore ?? 0,
          "Utilisation %": perf ? `${Math.round((perf.candidates / c.capacity) * 100)}%` : "—",
        };
      });
    default:
      return [Object.fromEntries(columns.map((c) => [c, ""]))];
  }
}
