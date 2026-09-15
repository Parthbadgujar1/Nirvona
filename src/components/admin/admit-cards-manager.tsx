"use client";

import * as React from "react";
import { CheckCircle2, Download, Eye, IdCard, Printer, Send, Sparkles, XCircle } from "lucide-react";
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
import { adminService } from "@/services/admin.service";
import { getCourse } from "@/data/courses";
import { formatNumber, formatDateTime } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";
import type { AdmitCard } from "@/types";

type BulkAction = "generate" | "publish" | "notify";

const BULK_COPY: Record<BulkAction, { title: string; description: string; confirm: string }> = {
  generate: {
    title: "Generate admit cards?",
    description:
      "Admit cards are generated with seat allocation for every registered candidate who doesn't already have one. Generated cards are not visible to students until published.",
    confirm: "Generate admit cards",
  },
  publish: {
    title: "Publish admit cards?",
    description:
      "Publishing makes every generated admit card for this exam downloadable in each candidate's student portal immediately. This action is visible to students.",
    confirm: "Publish admit cards",
  },
  notify: {
    title: "Send notifications?",
    description:
      "Every candidate registered for this exam receives a WhatsApp, SMS and email notification telling them their admit card is available.",
    confirm: "Send notifications",
  },
};

export function AdmitCardsManager() {
  const exams = useAsync(() => adminService.exams(), []);
  const students = useAsync(() => adminService.students(), []);

  // Was hard-coded to "CBT-04", a mock-era id matching no real exam -
  // every admit-card fetch below silently asked the backend for an
  // exam that doesn't exist. Empty until real exams load, then
  // defaults to the first one.
  const [examId, setExamId] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({ status: "all" });
  const [selected, setSelected] = React.useState<string[]>([]);
  const [bulk, setBulk] = React.useState<BulkAction | null>(null);
  const [preview, setPreview] = React.useState<AdmitCard | null>(null);
  const [revokeTarget, setRevokeTarget] = React.useState<AdmitCard | null>(null);

  React.useEffect(() => {
    if (!examId && exams.data && exams.data.length > 0) {
      setExamId(exams.data[0].id);
    }
  }, [examId, exams.data]);

  const exam = exams.data?.find((e) => e.id === examId);

  // Refetches whenever the selected exam actually changes - previously
  // this ran once on mount with no dependency on the exam picker at
  // all, so switching "Examination" never loaded that exam's cards.
  const admitCards = useAsync(
    () => (exam ? adminService.admitCards(exam.id) : Promise.resolve([])),
    [exam?.id],
  );
  const credentials = useAsync(
    () => (exam ? adminService.credentials(exam.id) : Promise.resolve([])),
    [exam?.id],
  );
  const centre = useAsync(
    () => (exam?.centreId ? adminService.centre(exam.centreId) : Promise.resolve(undefined)),
    [exam?.centreId],
  );

  if (exams.status === "error") return <ErrorState onRetry={exams.reload} />;
  if (exams.status === "loading" || !exams.data || !exam) {
    return <LoadingState label="Loading examinations" />;
  }

  const rows = admitCards.data ?? [];

  const filtered = rows.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (search) {
      const name = row.studentName ?? "";
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
      sortValue: (row) => row.studentName ?? "",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-900">{row.studentName ?? "—"}</p>
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
      header: "",
      align: "right",
      hideOnCard: true,
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => setPreview(row)}
            disabled={row.status === "pending"}
          >
            <Eye />
            Preview
          </Button>
          {row.status !== "pending" && row.status !== "revoked" && (
            <Button variant="ghost" size="icon-sm" aria-label={`Revoke ${row.studentName}'s admit card`} onClick={() => setRevokeTarget(row)}>
              <XCircle />
            </Button>
          )}
        </div>
      ),
    },
  ];

  async function confirmRevoke() {
    if (!revokeTarget) return;
    try {
      await adminService.revokeAdmitCard(revokeTarget.id);
      admitCards.reload();
      toast.success(`Admit card revoked for ${revokeTarget.studentName ?? revokeTarget.studentId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke this admit card.");
    }
  }

  async function applyBulk(action: BulkAction) {
    if (!exam) return;
    try {
      if (action === "generate") {
        const result = await adminService.generateAdmitCards(exam.id);
        toast.success(`${formatNumber(result.generated)} admit card(s) generated`, {
          description:
            result.alreadyExisted > 0
              ? `${formatNumber(result.alreadyExisted)} candidate(s) already had one.`
              : `Status updated for ${exam.id}.`,
        });
      } else if (action === "publish") {
        const result = await adminService.publishAdmitCards(exam.id);
        toast.success(`${formatNumber(result.published)} admit card(s) published`, {
          description: `Now visible in each candidate's portal for ${exam.id}.`,
        });
      } else {
        await adminService.sendNotification({
          title: "Admit card ready",
          message: "Your admit card is available. Download it before your exam day.",
          type: "admit-card",
          channels: ["whatsapp", "sms", "email"],
          examId: exam.id,
        });
        toast.success("Notifications sent", {
          description: "WhatsApp, SMS and email notifications have been queued.",
        });
      }
      setSelected([]);
      admitCards.reload();
      exams.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Could not complete this action.`);
      throw error;
    }
  }

  const previewStudent = preview
    ? students.data?.find((s) => s.id === preview.studentId)
    : undefined;
  const credential = preview
    ? credentials.data?.find((c) => c.studentId === preview.studentId)
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
                    "Student Name": row.studentName ?? "",
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
            options: ["pending", "generated", "published", "sent", "revoked"].map((s) => ({ label: s, value: s })),
          },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setBulk("generate")}>
            Generate all
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setBulk("publish")}>
            Publish all
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
          if (bulk) return applyBulk(bulk);
        }}
        details={
          <div className="rounded-xl border border-ink-200 bg-canvas p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Examination</span>
              <span className="font-semibold text-navy-900">{exam.id}</span>
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-ink-500">Registered candidates</span>
              <span className="font-semibold tabular text-navy-900">
                {formatNumber(exam.candidates)}
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
                centre={centre.data}
                admitCard={preview}
                credential={credential}
                packageName="—"
                courseName={getCourse(exam.courseSlug)?.name ?? "—"}
                className="border-0 shadow-none"
              />
              <div className="mt-4 flex justify-end gap-2 no-print">
                <Button variant="secondary" size="sm" onClick={() => window.print()}>
                  <Printer />
                  Print
                </Button>
                <Button
                  size="sm"
                  disabled={preview.status === "published" || preview.status === "sent"}
                  onClick={async () => {
                    try {
                      await adminService.publishAdmitCard(preview.id);
                      setPreview(null);
                      admitCards.reload();
                      toast.success("Admit card published", {
                        description: `${previewStudent.fullName} can now download it from the portal.`,
                      });
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not publish this card.");
                    }
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

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title={`Revoke this admit card?`}
        description="The candidate loses access to this admit card in their portal. Regenerate it afterward if needed."
        confirmLabel="Revoke admit card"
        tone="danger"
        details={
          revokeTarget && (
            <div className="rounded-xl border border-ink-200 bg-canvas p-4 text-sm">
              <p className="font-semibold text-navy-900">
                {revokeTarget.studentName ?? revokeTarget.studentId}
              </p>
              <p className="mt-1 text-ink-500">
                Roll {revokeTarget.rollNumber} · Seat {revokeTarget.seatNo}
              </p>
            </div>
          )
        }
        onConfirm={confirmRevoke}
      />
    </div>
  );
}
