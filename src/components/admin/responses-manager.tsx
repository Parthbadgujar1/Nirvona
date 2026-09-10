"use client";

import * as React from "react";
import { CheckCircle2, Cpu, FileSpreadsheet, RefreshCcw, Upload, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/progress";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FileUpload, type UploadedFile } from "@/components/shared/file-upload";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService } from "@/services/admin.service";
import { formatDateTime, formatNumber } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";

interface ResponseUpload {
  examId: string;
  students: number;
  uploadedAt: string;
  validation: "valid" | "invalid" | "pending";
  processing: "queued" | "processing" | "evaluated" | "failed";
}

export function ResponsesManager() {
  const uploads = useAsync(() => adminService.responses(), []);
  const exams = useAsync(() => adminService.exams(), []);

  // Local edits layered over the service data; null means "unchanged".
  const [edited, setEdited] = React.useState<ResponseUpload[] | null>(null);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadExam, setUploadExam] = React.useState("CBT-04");
  const [file, setFile] = React.useState<UploadedFile | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [parsed, setParsed] = React.useState<{ students: number; questions: number } | null>(null);

  if (uploads.status === "error") return <ErrorState onRetry={uploads.reload} />;
  if (uploads.status === "loading" || !uploads.data) {
    return <LoadingState label="Loading response uploads" />;
  }

  const rows = edited ?? (uploads.data as ResponseUpload[]);
  const setRows = (update: (prev: ResponseUpload[]) => ResponseUpload[]) =>
    setEdited((prev) => update(prev ?? (uploads.data as ResponseUpload[]) ?? []));

  const evaluated = rows.filter((r) => r.processing === "evaluated").length;
  const totalStudents = rows.reduce((sum, r) => sum + r.students, 0);

  const columns: Column<ResponseUpload>[] = [
    {
      key: "examId",
      header: "Exam",
      primary: true,
      sortValue: (row) => row.examId,
      cell: (row) => (
        <div>
          <p className="font-display text-sm font-bold text-navy-900">{row.examId}</p>
          <p className="text-2xs text-ink-500">
            {exams.data?.find((e) => e.id === row.examId)?.name.split("· ")[1] ?? ""}
          </p>
        </div>
      ),
    },
    {
      key: "students",
      header: "Students",
      align: "right",
      sortValue: (row) => row.students,
      cell: (row) => <span className="tabular font-semibold text-navy-900">{formatNumber(row.students)}</span>,
    },
    {
      key: "uploadedAt",
      header: "Uploaded at",
      sortValue: (row) => row.uploadedAt,
      cell: (row) => <span className="text-xs text-ink-600">{formatDateTime(row.uploadedAt)}</span>,
    },
    {
      key: "validation",
      header: "Validation",
      cell: (row) => <StatusBadge status={row.validation} size="sm" />,
    },
    {
      key: "processing",
      header: "Processing",
      cell: (row) => <StatusBadge status={row.processing} size="sm" />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => {
              exportRows(
                timestampedName(`Nirvona_Responses_${row.examId}`),
                [row as unknown as Record<string, unknown>],
                [
                  { key: "examId", header: "Exam" },
                  { key: "students", header: "Students" },
                  { key: "uploadedAt", header: "Uploaded At" },
                  { key: "validation", header: "Validation" },
                  { key: "processing", header: "Processing" },
                ],
              );
              toast.success("Response summary exported");
            }}
          >
            Export
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setRows((prev) =>
                prev.map((r) =>
                  r.examId === row.examId ? { ...r, processing: "processing" as const } : r,
                ),
              );
              toast.info(`Re-evaluating ${row.examId}`, {
                description: "Responses are being scored against the published answer key.",
              });
              setTimeout(() => {
                setRows((prev) =>
                  prev.map((r) =>
                    r.examId === row.examId ? { ...r, processing: "evaluated" as const } : r,
                  ),
                );
                toast.success(`${row.examId} re-evaluated`, {
                  description: `${formatNumber(row.students)} responses scored.`,
                });
              }, 1800);
            }}
          >
            <RefreshCcw />
            Re-evaluate
          </Button>
        </div>
      ),
    },
  ];

  async function handleUpload(picked: UploadedFile) {
    setFile(picked);
    setParsed(null);
    setUploading(true);
    setProgress(0);
    for (let i = 1; i <= 10; i += 1) {
      await new Promise((r) => setTimeout(r, 80));
      setProgress(i * 10);
    }
    setUploading(false);
    setParsed({ students: 1284, questions: 90 });
    toast.success("Response file parsed", {
      description: "1,284 candidate response sets found across 90 questions.",
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Responses"
        description="Import candidate response files captured at the examination centres and queue them for evaluation."
        actions={
          <Button size="md" onClick={() => setUploadOpen(true)}>
            <Upload />
            Import responses
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Response files" numericValue={rows.length} icon={FileSpreadsheet} accent="navy" />
        <StatCard label="Evaluated" numericValue={evaluated} icon={CheckCircle2} accent="success" />
        <StatCard label="Candidate responses" numericValue={totalStudents} icon={Users} accent="royal" />
        <StatCard
          label="Awaiting import"
          numericValue={(exams.data ?? []).filter((e) => new Date(e.date) >= new Date("2026-09-05")).length}
          icon={Cpu}
          accent="ember"
          hint="Exams not yet conducted"
        />
      </div>

      <Alert tone="info" title="Evaluation runs against the published answer key">
        A response file can only be evaluated once the answer key for that examination has been
        validated. Re-evaluating regenerates every score, rank and percentile for that examination.
      </Alert>

      {rows.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No response files imported"
          description="Import the response capture file from an examination centre to begin evaluation."
          action={{ label: "Import responses", onClick: () => setUploadOpen(true) }}
        />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.examId} caption="Response uploads" />
      )}

      <Card className="p-5">
        <h2 className="font-display text-base font-semibold text-navy-900">Processing pipeline</h2>
        <p className="mt-1 text-sm text-ink-500">
          Each imported file passes through these stages before results can be published.
        </p>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: "Import", detail: "Response capture file received from the centre" },
            { step: "Validate", detail: "Student IDs, question count and option format checked" },
            { step: "Evaluate", detail: "Scored against the published answer key" },
            { step: "Rank", detail: "Percentile and rank computed across the cohort" },
          ].map((item, index) => (
            <li key={item.step} className="rounded-xl border border-ink-200 p-4">
              <span className="flex size-7 items-center justify-center rounded-full bg-navy-900 text-2xs font-bold text-white">
                {index + 1}
              </span>
              <p className="mt-3 font-display text-sm font-semibold text-navy-900">{item.step}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{item.detail}</p>
              <ProgressBar
                value={index < 3 ? 100 : 60}
                size="xs"
                tone={index < 3 ? "success" : "ember"}
                className="mt-3"
                label={`${item.step} progress`}
              />
            </li>
          ))}
        </ol>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Import student responses</DialogTitle>
            <DialogDescription>
              Upload the response capture file exported from the examination centre software.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <label htmlFor="resp-exam" className="mb-1.5 block text-sm font-medium text-ink-700">
                Examination
              </label>
              <Select id="resp-exam" value={uploadExam} onChange={(e) => setUploadExam(e.target.value)}>
                {(exams.data ?? []).map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.id} — {exam.name.split("· ")[1] ?? exam.name}
                  </option>
                ))}
              </Select>
            </div>

            <FileUpload
              file={file}
              uploading={uploading}
              progress={progress}
              onFileSelected={handleUpload}
              onClear={() => {
                setFile(null);
                setParsed(null);
              }}
              accept=".csv,.xlsx,.json"
              label="Drag and drop the response capture file"
              hint="CSV, XLSX or JSON · one row per candidate response"
            />

            {parsed && (
              <Alert tone="success" title="File parsed successfully">
                {formatNumber(parsed.students)} candidate response sets found across{" "}
                {parsed.questions} questions. All student IDs matched the {uploadExam} candidate
                list.
              </Alert>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!parsed}
              onClick={() => {
                setRows((prev) => [
                  {
                    examId: uploadExam,
                    students: parsed?.students ?? 0,
                    uploadedAt: new Date().toISOString(),
                    validation: "valid" as const,
                    processing: "queued" as const,
                  },
                  ...prev,
                ]);
                setUploadOpen(false);
                setFile(null);
                setParsed(null);
                toast.success(`Responses imported for ${uploadExam}`, {
                  description: "Queued for evaluation against the published answer key.",
                });
              }}
            >
              Import and queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
