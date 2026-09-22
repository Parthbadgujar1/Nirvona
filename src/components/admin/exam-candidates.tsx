"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import { Download, IdCard, KeyRound, MapPin, UserPlus, Users } from "lucide-react";
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
import { formatDate, formatNumber } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";
import type { ExamCandidate } from "@/types";

export function ExamCandidates({ examId }: { examId: string }) {
  const exam = useAsync(() => adminService.exam(examId), [examId]);
  // Was a hard-coded "CBT-04" that ignored the `examId` prop entirely -
  // every exam's candidate roster page showed CBT-04's candidates (or
  // none), regardless of which exam was actually open.
  const candidates = useAsync(() => adminService.candidates(examId), [examId]);
  const [registering, setRegistering] = React.useState(false);

  async function registerEnrolled() {
    setRegistering(true);
    try {
      const result = await adminService.registerEnrolledCandidates(examId);
      candidates.reload();
      exam.reload();
      if (result.registered > 0) {
        toast.success(`${result.registered} candidate(s) registered`, {
          description: "Actively-enrolled students for this course who were not already candidates.",
        });
      } else {
        toast.info("No new candidates to add", {
          description: "Every actively-enrolled student for this course is already registered.",
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not register candidates.");
    } finally {
      setRegistering(false);
    }
  }

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

  const admitPending = Math.max(0, data.candidates - data.admitCardsGenerated);
  const credPending = Math.max(0, data.candidates - data.credentialsAssigned);
  // Coverage as a percentage; an exam with no candidates yet is 0%, not NaN.
  const coverage = (done: number) => (data.candidates ? Math.min(100, (done / data.candidates) * 100) : 0);
  const capacity = data.centreCapacity ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.name}
        description="Candidates, admit cards and credentials for this examination."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Exams", href: "/admin/exams" },
          { label: data.name },
        ]}
        actions={
          <>
            <Button variant="secondary" size="md" onClick={registerEnrolled} loading={registering}>
              <UserPlus />
              Register enrolled students
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                exportRows(
                  timestampedName(`Nirvona_Candidates_${data.name.replace(/[^A-Za-z0-9]+/g, "_")}`),
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
              <Link to="/admin/exam-credentials">
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
              { label: "Reporting time", value: data.reportingTime || "Not set" },
              { label: "Exam time", value: data.examTime || "Not set" },
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
            {data.centreName ? (
              <>
                <p className="mt-2 text-sm font-semibold text-navy-900">{data.centreName}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                  {[data.centreAddress, data.centreCity].filter(Boolean).join(", ")}
                  {data.centrePincode ? ` — ${data.centrePincode}` : ""}
                  {capacity > 0 && (
                    <>
                      <br />
                      Capacity {formatNumber(capacity)}
                      {data.centreLabs ? ` across ${data.centreLabs} labs` : ""}
                    </>
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm font-semibold text-navy-900">No centre assigned yet</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                  Choose an examination centre from{" "}
                  <Link to="/admin/exams" className="font-semibold text-royal-700 hover:underline">
                    the exams list
                  </Link>{" "}
                  (Edit exam).
                </p>
              </>
            )}
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
          value={capacity > 0 ? `${Math.round((data.candidates / capacity) * 100)}%` : "—"}
          icon={MapPin}
          accent="success"
          hint={capacity > 0 ? `${formatNumber(data.candidates)} of ${formatNumber(capacity)} seats` : "No centre assigned"}
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
            value={coverage(data.admitCardsGenerated)}
            tone="royal"
            label="Admit card coverage"
          />
          <Button asChild variant="secondary" size="sm" className="mt-4">
            <Link to="/admin/admit-cards">Generate remaining</Link>
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
            value={coverage(data.credentialsAssigned)}
            tone="ember"
            label="Credential coverage"
          />
          <Button asChild variant="secondary" size="sm" className="mt-4">
            <Link to="/admin/exam-credentials">Upload credentials</Link>
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
      ) : rows.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No candidates registered yet"
          description="Register every actively-enrolled student of this exam's course as a candidate, then generate admit cards and assign credentials."
          action={{ label: "Register enrolled students", onClick: registerEnrolled }}
        />
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
          caption={`Candidates for ${data.name}`}
        />
      )}

    </div>
  );
}
