"use client";

import * as React from "react";
import Link from "next/link";
import { Download, IdCard, KeyRound, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FilterBar } from "@/components/shared/filters";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService } from "@/services/admin.service";
import { getCentre } from "@/data/exams";
import { formatDate, formatNumber } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";
import type { ExamCandidate } from "@/types";

export function ExamCandidates({ examId }: { examId: string }) {
  const exam = useAsync(() => adminService.exam(examId), [examId]);
  const candidates = useAsync(() => adminService.candidates("CBT-04"), []);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({
    admit: "all",
    credential: "all",
  });

  if (exam.status === "error") return <ErrorState onRetry={exam.reload} />;
  if (exam.status === "loading") return <LoadingState label="Loading examination" />;

  if (!exam.data) {
    return (
      <EmptyState
        branded
        title="Examination not found"
        description={`No examination exists with the code ${examId}.`}
        action={{ label: "Back to exams", href: "/admin/exams" }}
      />
    );
  }

  const data = exam.data;
  const centre = getCentre(data.centreId);
  const rows = candidates.data ?? [];

  const filtered = rows.filter((row) => {
    if (filters.admit !== "all" && row.admitCardStatus !== filters.admit) return false;
    if (filters.credential !== "all" && row.credentialStatus !== filters.credential) return false;
    if (search && !`${row.studentId} ${row.studentName} ${row.seatNo}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const columns: Column<ExamCandidate>[] = [
    {
      key: "studentName",
      header: "Candidate",
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
      key: "seatNo",
      header: "Seat",
      sortValue: (row) => row.seatNo ?? "",
      cell: (row) => <span className="font-mono text-xs text-ink-600">{row.seatNo}</span>,
    },
    {
      key: "admitCardStatus",
      header: "Admit card",
      sortValue: (row) => row.admitCardStatus,
      cell: (row) => <StatusBadge kind="admitCard" status={row.admitCardStatus} size="sm" />,
    },
    {
      key: "credentialStatus",
      header: "Credential",
      sortValue: (row) => row.credentialStatus,
      cell: (row) => <StatusBadge kind="credential" status={row.credentialStatus} size="sm" />,
    },
    {
      key: "attendance",
      header: "Attendance",
      cell: (row) => (
        <Badge tone="neutral" size="sm">
          {row.attendance ?? "pending"}
        </Badge>
      ),
    },
  ];

  const admitPending = data.candidates - data.admitCardsGenerated;
  const credPending = data.candidates - data.credentialsAssigned;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${data.id} · Candidates`}
        description={data.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Exams", href: "/admin/exams" },
          { label: data.id },
        ]}
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                exportRows(
                  timestampedName(`Nirvona_Candidates_${data.id}`),
                  filtered as unknown as Record<string, unknown>[],
                  [
                    { key: "studentId", header: "Student ID" },
                    { key: "studentName", header: "Student Name" },
                    { key: "examId", header: "Exam" },
                    { key: "seatNo", header: "Seat No" },
                    { key: "admitCardStatus", header: "Admit Card Status" },
                    { key: "credentialStatus", header: "Credential Status" },
                  ],
                );
                toast.success(`${filtered.length} candidates exported`);
              }}
            >
              <Download />
              Export candidates
            </Button>
            <Button asChild size="md">
              <Link href="/admin/exam-credentials">
                <KeyRound />
                Upload Credentials
              </Link>
            </Button>
          </>
        }
      />

      <Card className="p-5">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Exam date", value: formatDate(data.date, "full") },
              { label: "Reporting time", value: data.reportingTime },
              { label: "Exam time", value: data.examTime },
              { label: "Pattern", value: `${data.totalQuestions} questions · ${data.totalMarks} marks` },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                  {item.label}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-navy-900">{item.value}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded-xl bg-canvas p-4">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-ember-600" aria-hidden />
              <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">Centre</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-navy-900">{centre?.name}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
              {centre?.address}, {centre?.city} — {centre?.pincode}
              <br />
              Capacity {centre?.capacity} across {centre?.labs} labs
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total candidates" numericValue={data.candidates} icon={Users} accent="navy" />
        <StatCard
          label="Admit cards generated"
          numericValue={data.admitCardsGenerated}
          icon={IdCard}
          accent="royal"
          hint={`${formatNumber(admitPending)} pending`}
        />
        <StatCard
          label="Credentials assigned"
          numericValue={data.credentialsAssigned}
          icon={KeyRound}
          accent="ember"
          hint={`${formatNumber(credPending)} pending`}
        />
        <StatCard
          label="Centre utilisation"
          value={`${Math.round((data.candidates / (centre?.capacity ?? 1)) * 100)}%`}
          icon={MapPin}
          accent="success"
          hint={`${formatNumber(data.candidates)} of ${centre?.capacity} seats`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-navy-900">Admit card coverage</span>
            <span className="tabular text-ink-500">
              {formatNumber(data.admitCardsGenerated)} / {formatNumber(data.candidates)}
            </span>
          </div>
          <ProgressBar
            value={(data.admitCardsGenerated / data.candidates) * 100}
            tone="royal"
            label="Admit card coverage"
          />
          <Button asChild variant="secondary" size="sm" className="mt-4">
            <Link href="/admin/admit-cards">Generate remaining</Link>
          </Button>
        </Card>

        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-navy-900">Credential coverage</span>
            <span className="tabular text-ink-500">
              {formatNumber(data.credentialsAssigned)} / {formatNumber(data.candidates)}
            </span>
          </div>
          <ProgressBar
            value={(data.credentialsAssigned / data.candidates) * 100}
            tone="ember"
            label="Credential coverage"
          />
          <Button asChild variant="secondary" size="sm" className="mt-4">
            <Link href="/admin/exam-credentials">Upload credentials</Link>
          </Button>
        </Card>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search candidate name, ID or seat…"
        values={filters}
        resultCount={filtered.length}
        onChange={(id, value) => setFilters((f) => ({ ...f, [id]: value }))}
        onReset={() => {
          setFilters({ admit: "all", credential: "all" });
          setSearch("");
        }}
        filters={[
          {
            id: "admit",
            label: "Admit card",
            options: ["pending", "generated", "published", "sent"].map((s) => ({ label: s, value: s })),
          },
          {
            id: "credential",
            label: "Credential",
            options: ["pending", "assigned", "invalid", "duplicate"].map((s) => ({ label: s, value: s })),
          },
        ]}
      />

      {candidates.status === "loading" ? (
        <LoadingState label="Loading candidates" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No candidates match these filters"
          description="Clear the filters to see the full candidate list for this examination."
          action={{
            label: "Clear filters",
            onClick: () => {
              setFilters({ admit: "all", credential: "all" });
              setSearch("");
            },
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(row) => row.studentId}
          caption={`Candidates for ${data.id}`}
        />
      )}

      <p className="text-xs text-ink-400">
        Showing a representative sample of the {formatNumber(data.candidates)} assigned candidates.
        A production build paginates this list from the API.
      </p>
    </div>
  );
}
