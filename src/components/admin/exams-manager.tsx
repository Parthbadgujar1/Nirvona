"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarClock, CheckCircle2, Copy, Eye, IdCard, KeyRound, MoreHorizontal, Pencil, Plus,
  Send, Users, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import {
  Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger,
} from "@/components/ui/dropdown";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FilterBar } from "@/components/shared/filters";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingState, StaggerGroup, StaggerItem } from "@/components/shared/states";
import { ExamFormDialog } from "./exam-form";
import { useAsync } from "@/hooks/use-async";
import { adminService } from "@/services/admin.service";
import { COURSES } from "@/data/courses";
import { getCentre } from "@/data/exams";
import { formatDate, formatNumber } from "@/lib/format";
import type { Exam, ExamStatus } from "@/types";

export function ExamsManager() {
  const exams = useAsync(() => adminService.exams(), []);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({ course: "all", status: "all" });
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Exam | null>(null);
  const [confirm, setConfirm] = React.useState<{ exam: Exam; action: "publish" | "close" } | null>(null);
  const [overrides, setOverrides] = React.useState<Record<string, ExamStatus>>({});

  if (exams.status === "error") return <ErrorState onRetry={exams.reload} />;
  if (exams.status === "loading" || !exams.data) return <LoadingState label="Loading examinations" />;

  const all = exams.data.map((exam) => ({ ...exam, status: overrides[exam.id] ?? exam.status }));

  const filtered = all.filter((exam) => {
    if (filters.course !== "all" && !exam.courseSlugs.includes(filters.course as never)) return false;
    if (filters.status !== "all" && exam.status !== filters.status) return false;
    if (search && !`${exam.id} ${exam.name} ${exam.syllabusScope}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const upcoming = all.filter((e) => new Date(e.date) >= new Date("2026-09-05"));
  const totalCandidates = all.reduce((sum, e) => sum + e.candidates, 0);

  function applyStatus(examId: string, status: ExamStatus, message: string) {
    setOverrides((prev) => ({ ...prev, [examId]: status }));
    toast.success(message);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams"
        description="Create, schedule and publish computer-based examinations across programs and centres."
        actions={
          <Button
            size="md"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Create Exam
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total examinations" numericValue={all.length} icon={CalendarClock} accent="navy" />
        <StatCard label="Upcoming" numericValue={upcoming.length} icon={CalendarClock} accent="ember" />
        <StatCard label="Total candidates" numericValue={totalCandidates} icon={Users} accent="royal" />
        <StatCard
          label="Results published"
          numericValue={all.filter((e) => e.status === "result-published").length}
          icon={CheckCircle2}
          accent="success"
        />
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search exam code, name or scope…"
        values={filters}
        resultCount={filtered.length}
        onChange={(id, value) => setFilters((f) => ({ ...f, [id]: value }))}
        onReset={() => {
          setFilters({ course: "all", status: "all" });
          setSearch("");
        }}
        filters={[
          { id: "course", label: "Course", options: COURSES.map((c) => ({ label: c.shortName, value: c.slug })) },
          {
            id: "status",
            label: "Status",
            options: [
              { label: "Draft", value: "draft" },
              { label: "Scheduled", value: "scheduled" },
              { label: "Admit cards out", value: "admit-card-available" },
              { label: "Result published", value: "result-published" },
            ],
          },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No examinations match these filters"
          description="Adjust the filters, or create a new examination."
          action={{ label: "Create Exam", onClick: () => setFormOpen(true) }}
        />
      ) : (
        <StaggerGroup className="grid gap-5 xl:grid-cols-2">
          {filtered.map((exam) => {
            const centre = getCentre(exam.centreId);
            const admitPct = exam.candidates ? (exam.admitCardsGenerated / exam.candidates) * 100 : 0;
            const credPct = exam.candidates ? (exam.credentialsAssigned / exam.candidates) * 100 : 0;
            return (
              <StaggerItem key={exam.id}>
                <Card className="flex h-full flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 p-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-base font-bold text-navy-900">
                          {exam.id}
                        </span>
                        <StatusBadge kind="exam" status={exam.status} size="sm" />
                      </div>
                      <p className="mt-1 truncate text-sm text-ink-600">
                        {exam.name.split("· ")[1] ?? exam.name}
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {exam.courseSlugs.map((slug) => (
                          <li key={slug}>
                            <Badge tone="neutral" size="sm">
                              {COURSES.find((c) => c.slug === slug)?.shortName}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Dropdown>
                      <DropdownTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${exam.id}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownTrigger>
                      <DropdownContent>
                        <DropdownLabel>{exam.id}</DropdownLabel>
                        <DropdownSeparator />
                        <DropdownItem asChild>
                          <Link href={`/admin/exams/${exam.id}`}>
                            <Eye />
                            View candidates
                          </Link>
                        </DropdownItem>
                        <DropdownItem
                          onSelect={() => {
                            setEditing(exam);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil />
                          Edit exam
                        </DropdownItem>
                        <DropdownItem asChild>
                          <Link href="/admin/exam-credentials">
                            <KeyRound />
                            Manage credentials
                          </Link>
                        </DropdownItem>
                        <DropdownItem asChild>
                          <Link href="/admin/admit-cards">
                            <IdCard />
                            Admit cards
                          </Link>
                        </DropdownItem>
                        <DropdownItem
                          onSelect={() => {
                            navigator.clipboard?.writeText(exam.id);
                            toast.success("Exam code copied");
                          }}
                        >
                          <Copy />
                          Copy exam code
                        </DropdownItem>
                        <DropdownSeparator />
                        {exam.status === "draft" ? (
                          <DropdownItem onSelect={() => setConfirm({ exam, action: "publish" })}>
                            <Send />
                            Publish exam
                          </DropdownItem>
                        ) : (
                          <DropdownItem destructive onSelect={() => setConfirm({ exam, action: "close" })}>
                            <XCircle />
                            Close exam
                          </DropdownItem>
                        )}
                      </DropdownContent>
                    </Dropdown>
                  </div>

                  <div className="flex-1 p-5">
                    <dl className="grid gap-4 sm:grid-cols-2">
                      {[
                        { label: "Date", value: formatDate(exam.date, "full") },
                        { label: "Reporting", value: exam.reportingTime },
                        { label: "Exam time", value: exam.examTime },
                        { label: "Pattern", value: `${exam.totalQuestions} Q · ${exam.totalMarks} marks` },
                        { label: "Centre", value: centre ? `${centre.city} (${centre.code})` : "—" },
                        { label: "Scope", value: exam.syllabusScope },
                      ].map((item) => (
                        <div key={item.label} className="min-w-0">
                          <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                            {item.label}
                          </dt>
                          <dd className="mt-0.5 truncate text-sm font-medium text-navy-900">
                            {item.value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-5 space-y-4 border-t border-ink-100 pt-5">
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-ink-500">Admit cards generated</span>
                          <span className="font-semibold tabular text-navy-900">
                            {formatNumber(exam.admitCardsGenerated)} / {formatNumber(exam.candidates)}
                          </span>
                        </div>
                        <ProgressBar
                          value={admitPct}
                          size="sm"
                          tone={admitPct === 100 ? "success" : admitPct > 0 ? "ember" : "warning"}
                          label={`${exam.id} admit cards`}
                        />
                      </div>
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-ink-500">Credentials assigned</span>
                          <span className="font-semibold tabular text-navy-900">
                            {formatNumber(exam.credentialsAssigned)} / {formatNumber(exam.candidates)}
                          </span>
                        </div>
                        <ProgressBar
                          value={credPct}
                          size="sm"
                          tone={credPct === 100 ? "success" : credPct > 0 ? "ember" : "warning"}
                          label={`${exam.id} credentials`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-ink-100 p-5">
                    <Button asChild size="sm">
                      <Link href={`/admin/exams/${exam.id}`}>
                        <Users />
                        {formatNumber(exam.candidates)} candidates
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" size="sm">
                      <Link href="/admin/exam-credentials">Credentials</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/admin/admit-cards">Admit cards</Link>
                    </Button>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}

      <ExamFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        exam={editing}
        onSaved={(values) => {
          if (editing) {
            applyStatus(editing.id, values.status as ExamStatus, `${editing.id} updated`);
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.action === "publish" ? `Publish ${confirm.exam.id}?` : `Close ${confirm?.exam.id}?`}
        description={
          confirm?.action === "publish"
            ? "Publishing makes this examination visible to every assigned candidate and starts the admit card timeline."
            : "Closing stops new candidate assignments. Existing admit cards and credentials remain valid."
        }
        confirmLabel={confirm?.action === "publish" ? "Publish exam" : "Close exam"}
        tone={confirm?.action === "close" ? "danger" : "default"}
        details={
          confirm && (
            <div className="rounded-xl border border-ink-200 bg-canvas p-4 text-sm">
              <p className="font-semibold text-navy-900">{confirm.exam.name}</p>
              <p className="mt-1 text-ink-500">
                {formatDate(confirm.exam.date, "full")} ·{" "}
                {formatNumber(confirm.exam.candidates)} candidates assigned
              </p>
            </div>
          )
        }
        onConfirm={() => {
          if (!confirm) return;
          applyStatus(
            confirm.exam.id,
            confirm.action === "publish" ? "scheduled" : "completed",
            confirm.action === "publish"
              ? `${confirm.exam.id} published to ${formatNumber(confirm.exam.candidates)} candidates`
              : `${confirm.exam.id} closed`,
          );
        }}
      />
    </div>
  );
}
