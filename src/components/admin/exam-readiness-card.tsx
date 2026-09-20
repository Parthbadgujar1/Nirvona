"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingState } from "@/components/shared/states";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Exam } from "@/types";

/** Exams that still need preparing: not yet running, finished or awaiting results. */
const PREPARING = new Set<Exam["status"]>(["draft", "scheduled", "admit-card-available"]);
const COLLAPSED_COUNT = 4;

type Readiness =
  | { kind: "empty" }
  | { kind: "ready" }
  | { kind: "pending"; missing: string[] };

function readinessOf(exam: Exam): Readiness {
  if (!exam.candidates) return { kind: "empty" };
  const missing: string[] = [];
  if (exam.admitCardsGenerated < exam.candidates) missing.push("admit cards");
  if (exam.credentialsAssigned < exam.candidates) missing.push("credentials");
  return missing.length ? { kind: "pending", missing } : { kind: "ready" };
}

/** "today", "tomorrow", "in 5 days", "3 days ago" - calendar days, not 24-hour blocks. */
function whenLabel(iso: string, now: Date): { text: string; overdue: boolean; soon: boolean } {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(new Date(iso)) - start(now)) / 86_400_000);
  if (days === 0) return { text: "today", overdue: false, soon: true };
  if (days === 1) return { text: "tomorrow", overdue: false, soon: true };
  if (days > 1) return { text: `in ${days} days`, overdue: false, soon: days <= 3 };
  return { text: `${-days} day${days === -1 ? "" : "s"} ago`, overdue: true, soon: false };
}

function Coverage({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total ? Math.min(100, (done / total) * 100) : 0;
  const complete = total > 0 && done >= total;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="text-ink-500">{label}</span>
        <span className="tabular text-ink-500">
          <span className="font-semibold text-navy-900">
            {formatNumber(done)} / {formatNumber(total)}
          </span>
          {total > 0 && <span className="ml-1.5">{Math.round(pct)}%</span>}
        </span>
      </div>
      <ProgressBar
        value={pct}
        size="sm"
        tone={complete ? "success" : done > 0 ? "ember" : "warning"}
        label={label}
      />
    </div>
  );
}

/**
 * Dashboard panel: for each exam that still needs preparing, how many of its
 * candidates already have an admit card and exam credentials. The two bars are
 * counts of real records (computed live by the API), so 5/5 + 5/5 means every
 * candidate can actually sit the exam.
 */
export function ExamReadinessCard({ exams, loading }: { exams: Exam[] | undefined; loading: boolean }) {
  const [showAll, setShowAll] = React.useState(false);
  const now = new Date();

  const upcoming = (exams ?? [])
    .filter((exam) => PREPARING.has(exam.status))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const ready = upcoming.filter((exam) => readinessOf(exam).kind === "ready").length;
  const needsAttention = upcoming.filter((exam) => readinessOf(exam).kind === "pending").length;
  const visible = showAll ? upcoming : upcoming.slice(0, COLLAPSED_COUNT);

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 p-5">
        <div>
          <h2 className="font-display text-base font-semibold text-navy-900">Examination readiness</h2>
          <p className="mt-1 text-xs text-ink-500">
            Are admit cards and login credentials in place for every candidate?
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/exams">
            All exams
            <ArrowRight />
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="p-5">
          <LoadingState label="Loading examinations" />
        </div>
      ) : upcoming.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-canvas text-ink-400">
            <CalendarClock className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-sm font-semibold text-navy-900">No examinations to prepare</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-500">
            Draft, scheduled and admit-card-stage exams appear here with their readiness. Schedule one to get started.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/admin/exams">
              <Plus />
              Create exam
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* At-a-glance summary */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-b border-ink-100 bg-canvas/60 px-5 py-2.5 text-xs">
            <span className="text-ink-500">
              <strong className="font-semibold text-navy-900">{upcoming.length}</strong> to prepare
            </span>
            <span className="inline-flex items-center gap-1.5 text-success-700">
              <CheckCircle2 className="size-3.5" aria-hidden />
              <strong className="font-semibold">{ready}</strong> ready
            </span>
            {needsAttention > 0 && (
              <span className="inline-flex items-center gap-1.5 text-warning-700">
                <AlertTriangle className="size-3.5" aria-hidden />
                <strong className="font-semibold">{needsAttention}</strong> need attention
              </span>
            )}
          </div>

          <ul className="divide-y divide-ink-100">
            {visible.map((exam) => {
              const state = readinessOf(exam);
              const when = whenLabel(exam.date, now);
              const urgent = state.kind === "pending" && (when.soon || when.overdue);
              return (
                <li key={exam.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-bold text-navy-900">{exam.name}</span>
                        <StatusBadge kind="exam" status={exam.status} size="sm" />
                      </div>
                      <p className="mt-1 text-xs text-ink-500">
                        {formatDate(exam.date, "full")}
                        <span
                          className={cn(
                            "ml-1.5 font-medium",
                            when.overdue ? "text-danger-600" : when.soon ? "text-ember-600" : "text-ink-400",
                          )}
                        >
                          ({when.text})
                        </span>
                        <span className="mx-1.5 text-ink-300" aria-hidden>
                          ·
                        </span>
                        {formatNumber(exam.candidates)} candidate{exam.candidates === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {state.kind === "ready" && (
                        <Badge tone="success" size="sm">
                          Ready
                        </Badge>
                      )}
                      {state.kind === "pending" && (
                        <Badge tone={urgent ? "danger" : "warning"} size="sm">
                          {urgent ? "Urgent · needs " : "Needs "}
                          {state.missing.join(" & ")}
                        </Badge>
                      )}
                      {state.kind === "empty" && (
                        <Badge tone="neutral" size="sm">
                          No candidates yet
                        </Badge>
                      )}
                      <Button asChild variant="secondary" size="xs">
                        <Link to={`/admin/exams/${exam.id}`}>Manage</Link>
                      </Button>
                    </div>
                  </div>

                  {state.kind !== "empty" && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Coverage label="Admit cards" done={exam.admitCardsGenerated} total={exam.candidates} />
                      <Coverage label="Credentials" done={exam.credentialsAssigned} total={exam.candidates} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {upcoming.length > COLLAPSED_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-auto flex w-full items-center justify-center gap-1.5 border-t border-ink-100 py-3 text-xs font-semibold text-royal-700 transition-colors hover:bg-canvas"
              aria-expanded={showAll}
            >
              {showAll ? "Show fewer" : `Show all ${upcoming.length} exams`}
              <ChevronDown className={cn("size-4 transition-transform", showAll && "rotate-180")} aria-hidden />
            </button>
          )}
        </>
      )}
    </Card>
  );
}
