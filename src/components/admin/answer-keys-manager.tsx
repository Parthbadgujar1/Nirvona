"use client";

import * as React from "react";
import { CheckCircle2, Download, Eye, FileCheck2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/input";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService } from "@/services/admin.service";
import { formatDateTime } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";
import type { AnswerKey, AnswerKeyEntry } from "@/types";

const VALID_OPTIONS = ["A", "B", "C", "D"] as const;

/**
 * Parses the pasted answer key text, one question per line:
 * `qNo,subject,topic,correctOption,marks,negative`. There's no real
 * XLSX/CSV file-parsing backend for this yet, so paste is the honest
 * real input method for now, rather than faking a file upload that
 * silently discards whatever was actually in the file (as the old
 * version did - it never read the file at all).
 */
function parseEntries(text: string): { entries: AnswerKeyEntry[]; errors: string[] } {
  const errors: string[] = [];
  const entries: AnswerKeyEntry[] = [];
  const seen = new Set<number>();

  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const parts = line.split(",").map((p) => p.trim());
      const lineNo = index + 1;
      if (parts.length !== 6) {
        errors.push(`Line ${lineNo}: expected 6 comma-separated values, got ${parts.length}.`);
        return;
      }
      const [qNoStr, subject, topic, correctOption, marksStr, negativeStr] = parts;
      const qNo = Number(qNoStr);
      const marks = Number(marksStr);
      const negative = Number(negativeStr);
      if (!Number.isInteger(qNo) || qNo <= 0) {
        errors.push(`Line ${lineNo}: "${qNoStr}" is not a valid question number.`);
        return;
      }
      if (seen.has(qNo)) {
        errors.push(`Line ${lineNo}: question ${qNo} is duplicated.`);
        return;
      }
      if (!VALID_OPTIONS.includes(correctOption.toUpperCase() as (typeof VALID_OPTIONS)[number])) {
        errors.push(`Line ${lineNo}: "${correctOption}" is not one of A/B/C/D.`);
        return;
      }
      if (Number.isNaN(marks) || Number.isNaN(negative)) {
        errors.push(`Line ${lineNo}: marks/negative must be numbers.`);
        return;
      }
      seen.add(qNo);
      entries.push({
        qNo,
        subject,
        topic,
        correctOption: correctOption.toUpperCase() as AnswerKeyEntry["correctOption"],
        marks,
        negative,
      });
    });

  return { entries: entries.sort((a, b) => a.qNo - b.qNo), errors };
}

export function AnswerKeysManager() {
  const exams = useAsync(() => adminService.exams(), []);
  const keys = useAsync(() => adminService.answerKeys(), []);

  const [uploadOpen, setUploadOpen] = React.useState("");
  const [uploadExam, setUploadExam] = React.useState("");
  const [pasted, setPasted] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [preview, setPreview] = React.useState<AnswerKey | null>(null);
  const [confirm, setConfirm] = React.useState<{ examId: string; publish: boolean } | null>(null);

  React.useEffect(() => {
    if (!uploadExam && exams.data && exams.data.length > 0) {
      setUploadExam(exams.data[0].id);
    }
  }, [uploadExam, exams.data]);

  if (exams.status === "error" || keys.status === "error") {
    return <ErrorState onRetry={() => { exams.reload(); keys.reload(); }} />;
  }
  if (exams.status === "loading" || !exams.data || keys.status === "loading" || !keys.data) {
    return <LoadingState label="Loading answer keys" />;
  }

  const rows = keys.data;
  const published = rows.filter((r) => r.status === "published").length;
  const keyedExamIds = new Set(rows.map((r) => r.examId));
  const awaiting = exams.data.filter(
    (e) => (e.status === "completed" || e.status === "result-published") && !keyedExamIds.has(e.id),
  ).length;

  const { entries: parsedEntries, errors: parseErrors } = parseEntries(pasted);

  const columns: Column<AnswerKey>[] = [
    {
      key: "examId",
      header: "Exam",
      primary: true,
      sortValue: (row) => row.examId,
      cell: (row) => (
        <div>
          <p className="font-display text-sm font-bold text-navy-900">
            {exams.data?.find((e) => e.id === row.examId)?.name ?? row.examId}
          </p>
          <p className="font-mono text-2xs text-ink-500">{row.examId}</p>
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
          <Button variant="secondary" size="xs" onClick={() => setPreview(row)}>
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

  async function saveKey() {
    if (parsedEntries.length === 0 || parseErrors.length > 0) return;
    setSaving(true);
    try {
      await adminService.uploadAnswerKey(uploadExam, parsedEntries);
      keys.reload();
      setUploadOpen("");
      setPasted("");
      toast.success(`Answer key saved for ${uploadExam}`, {
        description: `${parsedEntries.length} question(s) saved. Preview it, then publish when ready.`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this answer key.");
    } finally {
      setSaving(false);
    }
  }

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
          <Button size="md" onClick={() => setUploadOpen("open")}>
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
        sheet. Evaluation (Student Responses page) uses whichever version of the key is currently
        saved, published or not.
      </Alert>

      {rows.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No answer keys uploaded"
          description="Upload the answer key for a completed examination to begin evaluation."
          action={{ label: "Upload Answer Key", onClick: () => setUploadOpen("open") }}
        />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.examId} caption="Answer keys" />
      )}

      {/* Upload dialog */}
      <Dialog open={Boolean(uploadOpen)} onOpenChange={(open) => setUploadOpen(open ? "open" : "")}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Upload answer key</DialogTitle>
            <DialogDescription>
              One line per question: question number, subject, topic, correct option, marks,
              negative marks - comma-separated.
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
                    {exam.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="ak-paste" className="mb-1.5 block text-sm font-medium text-ink-700">
                Answer key entries
              </label>
              <Textarea
                id="ak-paste"
                rows={8}
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder={"1,Physics,Kinematics,A,4,1\n2,Chemistry,Atomic Structure,B,4,1"}
                className="font-mono text-xs"
              />
            </div>

            {pasted.trim() && parseErrors.length > 0 && (
              <Alert tone="danger" title={`${parseErrors.length} line(s) could not be parsed`}>
                <ul className="list-disc space-y-0.5 pl-4">
                  {parseErrors.slice(0, 8).map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                  {parseErrors.length > 8 && <li>...and {parseErrors.length - 8} more.</li>}
                </ul>
              </Alert>
            )}
            {pasted.trim() && parseErrors.length === 0 && parsedEntries.length > 0 && (
              <Alert tone="success" title="Validation passed">
                {parsedEntries.length} question(s) parsed - no duplicate question numbers, every
                option is one of A/B/C/D.
              </Alert>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setUploadOpen("")} disabled={saving}>
              Cancel
            </Button>
            <Button
              disabled={parsedEntries.length === 0 || parseErrors.length > 0 || !uploadExam}
              loading={saving}
              onClick={saveKey}
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
            <DialogTitle>
              Answer key · {exams.data?.find((e) => e.id === preview?.examId)?.name ?? preview?.examId}
            </DialogTitle>
            <DialogDescription>
              {preview ? `${preview.totalQuestions} questions · uploaded ${formatDateTime(preview.uploadedAt)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {preview && (
              <div className="max-h-[50vh] overflow-y-auto nv-scroll">
                <DataTable
                  columns={previewColumns}
                  rows={preview.entries}
                  rowKey={(row) => String(row.qNo)}
                  cardsOnMobile={false}
                  caption={`Answer key entries for ${preview.examId}`}
                />
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                if (!preview) return;
                exportRows(
                  timestampedName(`Nirvona_AnswerKey_${preview.examId}`),
                  preview.entries as unknown as Record<string, unknown>[],
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
        title={confirm?.publish ? `Publish the answer key?` : `Unpublish the answer key?`}
        description={
          confirm?.publish
            ? "Every candidate who appeared will immediately see the answer key and their response sheet."
            : "The answer key will be hidden from candidates. Published results derived from it are not affected."
        }
        confirmLabel={confirm?.publish ? "Publish answer key" : "Unpublish"}
        tone={confirm?.publish ? "default" : "danger"}
        onConfirm={async () => {
          if (!confirm) return;
          try {
            if (confirm.publish) {
              await adminService.publishAnswerKey(confirm.examId);
            } else {
              await adminService.unpublishAnswerKey(confirm.examId);
            }
            keys.reload();
            toast.success(confirm.publish ? "Answer key published" : "Answer key unpublished");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not update this answer key.");
            throw error;
          }
        }}
      />
    </div>
  );
}
