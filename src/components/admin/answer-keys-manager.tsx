"use client";

import * as React from "react";
import { CheckCircle2, Download, Eye, FileCheck2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FileUpload, type UploadedFile } from "@/components/shared/file-upload";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService } from "@/services/admin.service";
import { ANSWER_KEYS } from "@/data/results";
import { formatDateTime, formatNumber } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";
import type { AnswerKey, AnswerKeyEntry } from "@/types";

type KeyRow = {
  examId: string;
  uploadedAt: string;
  totalQuestions: number;
  status: AnswerKey["status"];
  publishedAt?: string;
};

export function AnswerKeysManager() {
  const exams = useAsync(() => adminService.exams(), []);
  const [statusOverrides, setStatusOverrides] = React.useState<Record<string, AnswerKey["status"]>>({});
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadExam, setUploadExam] = React.useState("CBT-04");
  const [file, setFile] = React.useState<UploadedFile | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [validated, setValidated] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<{ examId: string; publish: boolean } | null>(null);

  if (exams.status === "error") return <ErrorState onRetry={exams.reload} />;
  if (exams.status === "loading" || !exams.data) return <LoadingState label="Loading answer keys" />;

  const rows: KeyRow[] = Object.values(ANSWER_KEYS).map((key) => ({
    examId: key.examId,
    uploadedAt: key.uploadedAt,
    totalQuestions: key.totalQuestions,
    status: statusOverrides[key.examId] ?? key.status,
    publishedAt: key.publishedAt,
  }));

  const published = rows.filter((r) => r.status === "published").length;
  const awaiting = exams.data.filter(
    (e) => new Date(e.date) < new Date("2026-09-05") && !ANSWER_KEYS[e.id],
  ).length;

  const columns: Column<KeyRow>[] = [
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
      key: "uploadedAt",
      header: "Upload date",
      sortValue: (row) => row.uploadedAt,
      cell: (row) => <span className="text-xs text-ink-600">{formatDateTime(row.uploadedAt)}</span>,
    },
    {
      key: "totalQuestions",
      header: "Questions",
      align: "right",
      sortValue: (row) => row.totalQuestions,
      cell: (row) => <span className="tabular text-ink-700">{row.totalQuestions}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => (
        <Badge tone={row.status === "published" ? "success" : row.status === "validated" ? "royal" : "neutral"} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="xs" onClick={() => setPreview(row.examId)}>
            <Eye />
            Preview
          </Button>
          {row.status === "published" ? (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setConfirm({ examId: row.examId, publish: false })}
            >
              <XCircle />
              Unpublish
            </Button>
          ) : (
            <Button size="xs" onClick={() => setConfirm({ examId: row.examId, publish: true })}>
              <CheckCircle2 />
              Publish
            </Button>
          )}
        </div>
      ),
    },
  ];

  async function handleUpload(picked: UploadedFile) {
    setFile(picked);
    setValidated(false);
    setUploading(true);
    setProgress(0);
    for (let i = 1; i <= 10; i += 1) {
      await new Promise((r) => setTimeout(r, 70));
      setProgress(i * 10);
    }
    setUploading(false);
    setValidated(true);
    toast.success("Answer key validated", {
      description: "90 of 90 questions parsed with no duplicate question numbers.",
    });
  }

  const previewKey = preview ? ANSWER_KEYS[preview] : undefined;

  const previewColumns: Column<AnswerKeyEntry>[] = [
    { key: "qNo", header: "Q. No", cell: (row) => <span className="tabular font-semibold">{row.qNo}</span>, primary: true },
    { key: "subject", header: "Subject" },
    { key: "topic", header: "Topic" },
    {
      key: "correctOption",
      header: "Correct",
      cell: (row) => (
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-success-100 text-xs font-bold text-success-700">
          {row.correctOption}
        </span>
      ),
    },
    { key: "marks", header: "Marks", align: "right", cell: (row) => <span className="tabular">+{row.marks}</span> },
    { key: "negative", header: "Negative", align: "right", cell: (row) => <span className="tabular">−{row.negative}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Answer Keys"
        description="Upload, validate, preview and publish the official answer key for each examination."
        actions={
          <Button size="md" onClick={() => setUploadOpen(true)}>
            <Upload />
            Upload Answer Key
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Answer keys" numericValue={rows.length} icon={FileCheck2} accent="navy" />
        <StatCard label="Published" numericValue={published} icon={CheckCircle2} accent="success" />
        <StatCard label="Awaiting upload" numericValue={awaiting} icon={Upload} accent="ember" />
        <StatCard
          label="Questions keyed"
          numericValue={rows.reduce((sum, r) => sum + r.totalQuestions, 0)}
          icon={FileCheck2}
          accent="royal"
        />
      </div>

      <Alert tone="info" title="Publishing opens the objection window">
        Publishing an answer key makes it visible to every candidate along with their response
        sheet, and opens a 48-hour objection window. Upheld objections trigger automatic
        re-evaluation of all affected results.
      </Alert>

      {rows.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No answer keys uploaded"
          description="Upload the answer key for a completed examination to begin evaluation."
          action={{ label: "Upload Answer Key", onClick: () => setUploadOpen(true) }}
        />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.examId} caption="Answer keys" />
      )}

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Upload answer key</DialogTitle>
            <DialogDescription>
              One row per question with the question number, subject, topic, correct option and
              marking scheme.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <label htmlFor="ak-exam-select" className="mb-1.5 block text-sm font-medium text-ink-700">
                Examination
              </label>
              <Select
                id="ak-exam-select"
                value={uploadExam}
                onChange={(e) => setUploadExam(e.target.value)}
              >
                {exams.data.map((exam) => (
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
                setValidated(false);
              }}
              label="Drag and drop the answer key workbook"
              hint="Columns: Q No, Subject, Topic, Correct Option, Marks, Negative"
            />

            {validated && (
              <Alert tone="success" title="Validation passed">
                90 of 90 questions parsed · no duplicate question numbers · every option is one of
                A/B/C/D · marking scheme consistent across all rows.
              </Alert>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!validated}
              onClick={() => {
                setStatusOverrides((prev) => ({ ...prev, [uploadExam]: "validated" }));
                setUploadOpen(false);
                setFile(null);
                setValidated(false);
                toast.success(`Answer key saved for ${uploadExam}`, {
                  description: "Preview it, then publish when you are ready.",
                });
              }}
            >
              Save answer key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Answer key · {preview}</DialogTitle>
            <DialogDescription>
              {previewKey ? `${previewKey.totalQuestions} questions · uploaded ${formatDateTime(previewKey.uploadedAt)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {previewKey && (
              <div className="max-h-[50vh] overflow-y-auto nv-scroll">
                <DataTable
                  columns={previewColumns}
                  rows={previewKey.entries.slice(0, 30)}
                  rowKey={(row) => String(row.qNo)}
                  cardsOnMobile={false}
                  caption={`Answer key entries for ${preview}`}
                />
              </div>
            )}
            <p className="mt-3 text-xs text-ink-400">
              Showing the first 30 of {previewKey?.totalQuestions ?? 0} questions.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                if (!previewKey) return;
                exportRows(
                  timestampedName(`Nirvona_AnswerKey_${previewKey.examId}`),
                  previewKey.entries as unknown as Record<string, unknown>[],
                  [
                    { key: "qNo", header: "Q No" },
                    { key: "subject", header: "Subject" },
                    { key: "topic", header: "Topic" },
                    { key: "correctOption", header: "Correct Option" },
                    { key: "marks", header: "Marks" },
                    { key: "negative", header: "Negative" },
                  ],
                );
                toast.success("Answer key exported");
              }}
            >
              <Download />
              Download
            </Button>
            <Button onClick={() => setPreview(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.publish ? `Publish the ${confirm.examId} answer key?` : `Unpublish the ${confirm?.examId} answer key?`}
        description={
          confirm?.publish
            ? "Every candidate who appeared will immediately see the answer key and their response sheet, and the objection window opens."
            : "The answer key will be hidden from candidates. Published results derived from it are not affected."
        }
        confirmLabel={confirm?.publish ? "Publish answer key" : "Unpublish"}
        tone={confirm?.publish ? "default" : "danger"}
        onConfirm={() => {
          if (!confirm) return;
          setStatusOverrides((prev) => ({
            ...prev,
            [confirm.examId]: confirm.publish ? "published" : "unpublished",
          }));
          toast.success(
            confirm.publish
              ? `${confirm.examId} answer key published`
              : `${confirm.examId} answer key unpublished`,
            {
              description: confirm.publish
                ? `Visible to ${formatNumber(1188)} candidates. Objection window closes in 48 hours.`
                : undefined,
            },
          );
        }}
      />
    </div>
  );
}
