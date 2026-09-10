"use client";

import * as React from "react";
import { CheckCircle2, Download, Eye, IdCard, Printer, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FilterBar } from "@/components/shared/filters";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AdmitCardSheet } from "@/components/shared/admit-card";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService, adminData } from "@/services/admin.service";
import { STUDENTS } from "@/data/students";
import { getCentre } from "@/data/exams";
import { getPackage } from "@/data/packages";
import { getCourse } from "@/data/courses";
import { formatNumber, formatDateTime } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";
import type { AdmitCard, AdmitCardStatus } from "@/types";

type BulkAction = "generate" | "publish" | "notify";

const BULK_COPY: Record<BulkAction, { title: string; description: string; confirm: string; next: AdmitCardStatus }> = {
  generate: {
    title: "Generate admit cards?",
    description:
      "Admit cards are generated with seat allocation and exam-hall credentials for the selected candidates. Generated cards are not visible to students until published.",
    confirm: "Generate admit cards",
    next: "generated",
  },
  publish: {
    title: "Publish admit cards?",
    description:
      "Publishing makes the admit cards downloadable in each candidate's student portal immediately. This action is visible to students.",
    confirm: "Publish admit cards",
    next: "published",
  },
  notify: {
    title: "Send notifications?",
    description:
      "Candidates will receive a WhatsApp, SMS and email notification telling them their admit card is available.",
    confirm: "Send notifications",
    next: "sent",
  },
};

export function AdmitCardsManager() {
  const exams = useAsync(() => adminService.exams(), []);
  const admitCards = useAsync(() => adminService.admitCards("CBT-04"), []);

  const [examId, setExamId] = React.useState("CBT-04");
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({ status: "all" });
  const [selected, setSelected] = React.useState<string[]>([]);
  const [overrides, setOverrides] = React.useState<Record<string, AdmitCardStatus>>({});
  const [bulk, setBulk] = React.useState<BulkAction | null>(null);
  const [preview, setPreview] = React.useState<AdmitCard | null>(null);

  if (exams.status === "error") return <ErrorState onRetry={exams.reload} />;
  if (exams.status === "loading" || !exams.data) return <LoadingState label="Loading examinations" />;

  const exam = exams.data.find((e) => e.id === examId) ?? exams.data[0];
  const rows = (admitCards.data ?? []).map((card) => ({
    ...card,
    status: overrides[card.id] ?? card.status,
  }));

  const student = (id: string) => STUDENTS.find((s) => s.id === id);

  const filtered = rows.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (search) {
      const name = student(row.studentId)?.fullName ?? "";
      if (!`${row.studentId} ${name} ${row.rollNumber} ${row.seatNo}`.toLowerCase().includes(search.toLowerCase()))
        return false;
    }
    return true;
  });

  const counts = {
    pending: rows.filter((r) => r.status === "pending").length,
    generated: rows.filter((r) => r.status === "generated").length,
    published: rows.filter((r) => r.status === "published").length,
    sent: rows.filter((r) => r.status === "sent").length,
  };

  const columns: Column<AdmitCard>[] = [
    {
      key: "studentId",
      header: "Candidate",
      primary: true,
      sortValue: (row) => student(row.studentId)?.fullName ?? "",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-900">
            {student(row.studentId)?.fullName ?? "—"}
          </p>
          <p className="font-mono text-2xs text-ink-500">{row.studentId}</p>
        </div>
      ),
    },
    {
      key: "rollNumber",
      header: "Roll number",
      sortValue: (row) => row.rollNumber,
      cell: (row) => <span className="font-mono text-xs text-ink-700">{row.rollNumber}</span>,
    },
    {
      key: "seatNo",
      header: "Seat",
      cell: (row) => <span className="font-mono text-xs text-ink-600">{row.seatNo}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge kind="admitCard" status={row.status} size="sm" />,
    },
    {
      key: "generatedAt",
      header: "Generated",
      hideOnCard: true,
      cell: (row) => (
        <span className="text-xs text-ink-500">
          {row.generatedAt ? formatDateTime(row.generatedAt) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Preview",
      align: "right",
      cell: (row) => (
        <Button
          variant="secondary"
          size="xs"
          onClick={() => setPreview(row)}
          disabled={row.status === "pending"}
        >
          <Eye />
          Preview
        </Button>
      ),
    },
  ];

  function applyBulk(action: BulkAction) {
    const ids = selected.length ? selected : filtered.map((r) => r.id);
    setOverrides((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = BULK_COPY[action].next;
      });
      return next;
    });
    setSelected([]);
    const verb = { generate: "generated", publish: "published", notify: "notified" }[action];
    toast.success(`${formatNumber(ids.length)} admit cards ${verb}`, {
      description:
        action === "notify"
          ? "WhatsApp, SMS and email notifications have been queued."
          : `Status updated for ${exam.id}.`,
    });
  }

  const previewStudent = preview ? student(preview.studentId) : undefined;
  const credential = preview
    ? adminData.EXAM_CREDENTIALS.find((c) => c.studentId === preview.studentId)
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admit Cards"
        description="Generate, preview, publish and notify candidates about their examination admit cards."
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                exportRows(
                  timestampedName(`Nirvona_AdmitCards_${exam.id}`),
                  filtered.map((row) => ({
                    "Student ID": row.studentId,
                    "Student Name": student(row.studentId)?.fullName ?? "",
                    Exam: row.examId,
                    "Roll Number": row.rollNumber,
                    "Seat No": row.seatNo,
                    Status: row.status,
                    "Generated At": row.generatedAt ?? "",
                    "Published At": row.publishedAt ?? "",
                  })),
                  ["Student ID", "Student Name", "Exam", "Roll Number", "Seat No", "Status", "Generated At", "Published At"].map(
                    (key) => ({ key, header: key }),
                  ),
                );
                toast.success("Admit card report downloaded");
              }}
            >
              <Download />
              Export report
            </Button>
            <Button size="md" onClick={() => setBulk("generate")}>
              <Sparkles />
              Generate Admit Cards
            </Button>
          </>
        }
      />

      <Card className="p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <label htmlFor="ac-exam" className="mb-1.5 block text-sm font-medium text-ink-700">
              Examination
            </label>
            <Select id="ac-exam" value={exam.id} onChange={(e) => setExamId(e.target.value)}>
              {exams.data.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} — {item.name.split("· ")[1] ?? item.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-navy-900">Generation coverage</span>
              <span className="tabular text-ink-500">
                {formatNumber(exam.admitCardsGenerated)} / {formatNumber(exam.candidates)} candidates
              </span>
            </div>
            <ProgressBar
              value={(exam.admitCardsGenerated / exam.candidates) * 100}
              tone="royal"
              label="Admit card generation coverage"
            />
            <p className="mt-2 text-xs text-ink-500">
              {formatNumber(exam.candidates - exam.admitCardsGenerated)} candidates still pending
              generation for {exam.id}.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending" numericValue={counts.pending} icon={IdCard} accent="saffron" />
        <StatCard label="Generated" numericValue={counts.generated} icon={CheckCircle2} accent="royal" />
        <StatCard label="Published" numericValue={counts.published} icon={CheckCircle2} accent="success" />
        <StatCard label="Notification sent" numericValue={counts.sent} icon={Send} accent="ember" />
      </div>

      <Alert tone="info" title="Publishing is visible to students immediately">
        Generated cards stay internal until published. Publishing releases them to the student
        portal; sending notifications tells candidates they are available.
      </Alert>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search candidate, roll number or seat…"
        values={filters}
        resultCount={filtered.length}
        onChange={(id, value) => setFilters((f) => ({ ...f, [id]: value }))}
        onReset={() => {
          setFilters({ status: "all" });
          setSearch("");
        }}
        filters={[
          {
            id: "status",
            label: "Status",
            options: ["pending", "generated", "published", "sent"].map((s) => ({ label: s, value: s })),
          },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setBulk("generate")}>
            Generate {selected.length > 0 ? `(${selected.length})` : "all"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setBulk("publish")}>
            Publish {selected.length > 0 ? `(${selected.length})` : "all"}
          </Button>
          <Button variant="navy" size="sm" onClick={() => setBulk("notify")}>
            <Send />
            Notify
          </Button>
        </div>
      </FilterBar>

      {admitCards.status === "loading" ? (
        <LoadingState label="Loading admit cards" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={IdCard}
          title="Admit card not published yet"
          description="No admit cards match this view. Generate cards once seat allocation is complete for this examination."
          action={{ label: "Generate admit cards", onClick: () => setBulk("generate") }}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(row) => row.id}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          caption={`Admit cards for ${exam.id}`}
        />
      )}

      {/* Bulk confirm */}
      <ConfirmDialog
        open={Boolean(bulk)}
        onOpenChange={(open) => !open && setBulk(null)}
        title={bulk ? BULK_COPY[bulk].title : ""}
        description={bulk ? BULK_COPY[bulk].description : ""}
        confirmLabel={bulk ? BULK_COPY[bulk].confirm : "Confirm"}
        onConfirm={() => {
          if (bulk) applyBulk(bulk);
        }}
        details={
          <div className="rounded-xl border border-ink-200 bg-canvas p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Examination</span>
              <span className="font-semibold text-navy-900">{exam.id}</span>
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-ink-500">Candidates affected</span>
              <span className="font-semibold tabular text-navy-900">
                {formatNumber(selected.length || filtered.length)}
              </span>
            </div>
          </div>
        }
      />

      {/* Preview */}
      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent size="xl" className="p-0">
          <DialogHeader className="no-print">
            <DialogTitle>Admit card preview · {previewStudent?.fullName}</DialogTitle>
          </DialogHeader>
          {preview && previewStudent && (
            <div className="px-6 pb-6">
              <AdmitCardSheet
                student={previewStudent}
                exam={exam}
                centre={getCentre(exam.centreId)}
                admitCard={preview}
                credential={credential}
                packageName={getPackage("PKG-JEE-1Y")?.name ?? "—"}
                courseName={getCourse(previewStudent.examPreference[0])?.name ?? "—"}
                className="border-0 shadow-none"
              />
              <div className="mt-4 flex justify-end gap-2 no-print">
                <Button variant="secondary" size="sm" onClick={() => window.print()}>
                  <Printer />
                  Print
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setOverrides((prev) => ({ ...prev, [preview.id]: "published" }));
                    setPreview(null);
                    toast.success("Admit card published", {
                      description: `${previewStudent.fullName} can now download it from the portal.`,
                    });
                  }}
                >
                  <CheckCircle2 />
                  Publish this card
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
