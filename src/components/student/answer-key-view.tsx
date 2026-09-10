"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Download, ListChecks, MinusCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/filters";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { studentService } from "@/services/student.service";
import { exportRows, timestampedName } from "@/lib/export";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StudentResponseRow } from "@/types";

type Filter = "all" | "correct" | "incorrect" | "unattempted";

const FILTERS: { id: Filter; label: string; icon?: typeof CheckCircle2 }[] = [
  { id: "all", label: "All" },
  { id: "correct", label: "Correct", icon: CheckCircle2 },
  { id: "incorrect", label: "Incorrect", icon: XCircle },
  { id: "unattempted", label: "Unattempted", icon: MinusCircle },
];

export function AnswerKeyView() {
  const params = useSearchParams();
  const results = useAsync(() => studentService.results(), []);
  const [examId, setExamId] = React.useState(params.get("exam") ?? "");

  const publishedExams = results.data ?? [];
  const selectedExam = examId || publishedExams[0]?.examId || "";

  const responses = useAsync(
    () => (selectedExam ? studentService.responses(selectedExam) : Promise.resolve(undefined)),
    [selectedExam],
  );
  const answerKey = useAsync(
    () => (selectedExam ? studentService.answerKey(selectedExam) : Promise.resolve(undefined)),
    [selectedExam],
  );

  const [filter, setFilter] = React.useState<Filter>("all");
  const [subject, setSubject] = React.useState("all");
  const [query, setQuery] = React.useState("");

  if (results.status === "error") return <ErrorState onRetry={results.reload} />;
  if (results.status === "loading") return <LoadingState label="Loading your examinations" />;

  if (publishedExams.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Answer Key" />
        <EmptyState
          branded
          icon={ListChecks}
          title="No answer keys published yet"
          description="Answer keys are published within 24 hours of each examination, alongside your full response sheet."
          action={{ label: "View upcoming exams", href: "/student/exams" }}
        />
      </div>
    );
  }

  const rows = responses.data?.rows ?? [];
  const subjects = Array.from(new Set(rows.map((r) => r.subject)));

  const filtered = rows.filter((row) => {
    if (filter !== "all" && row.status !== filter) return false;
    if (subject !== "all" && row.subject !== subject) return false;
    if (query && !`${row.qNo} ${row.topic}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: rows.length,
    correct: rows.filter((r) => r.status === "correct").length,
    incorrect: rows.filter((r) => r.status === "incorrect").length,
    unattempted: rows.filter((r) => r.status === "unattempted").length,
  };

  function downloadKey() {
    exportRows(
      timestampedName(`Nirvona_AnswerKey_${selectedExam}`),
      filtered as unknown as Record<string, unknown>[],
      [
        { key: "qNo", header: "Q No" },
        { key: "subject", header: "Subject" },
        { key: "topic", header: "Topic" },
        { key: "correctOption", header: "Correct Answer" },
        { key: "markedOption", header: "Your Answer", value: (r) => (r as unknown as StudentResponseRow).markedOption ?? "Not attempted" },
        { key: "status", header: "Result" },
        { key: "marks", header: "Marks Awarded" },
        { key: "timeSpentSec", header: "Time Spent (sec)" },
      ],
    );
    toast.success("Answer key downloaded", { description: `${filtered.length} questions exported.` });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Answer Key"
        description="The official answer key alongside your recorded response for every question."
        breadcrumbs={[{ label: "Dashboard", href: "/student/dashboard" }, { label: "Answer Key" }]}
        actions={
          <Button size="md" onClick={downloadKey} disabled={filtered.length === 0}>
            <Download />
            Download answer key
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FILTERS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              filter === id
                ? "border-navy-900 bg-navy-50/60 ring-1 ring-navy-900"
                : "border-ink-200 bg-white hover:border-navy-200",
            )}
          >
            <div className="flex items-center gap-2">
              {Icon && (
                <Icon
                  className={cn(
                    "size-4",
                    id === "correct" && "text-success-600",
                    id === "incorrect" && "text-danger-600",
                    id === "unattempted" && "text-ink-400",
                  )}
                  aria-hidden
                />
              )}
              <span className="text-2xs font-bold uppercase tracking-wider text-ink-500">
                {label}
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold tabular text-navy-900">
              {counts[id]}
            </p>
          </button>
        ))}
      </div>

      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="lg:w-56">
            <label htmlFor="ak-exam" className="sr-only">
              Select examination
            </label>
            <Select
              id="ak-exam"
              value={selectedExam}
              onChange={(e) => setExamId(e.target.value)}
              className="h-10"
            >
              {publishedExams.map((result) => (
                <option key={result.examId} value={result.examId}>
                  {result.examId} — {formatDate(result.date)}
                </option>
              ))}
            </Select>
          </div>
          <div className="lg:w-48">
            <label htmlFor="ak-subject" className="sr-only">
              Filter by subject
            </label>
            <Select
              id="ak-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-10"
            >
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <SearchBar
            id="ak-search"
            value={query}
            onChange={setQuery}
            placeholder="Search question number or topic…"
            className="lg:flex-1"
          />
          <p className="shrink-0 text-xs font-medium text-ink-500">
            {filtered.length} question{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
      </Card>

      {answerKey.data && (
        <Alert tone="neutral">
          Answer key for <strong>{selectedExam}</strong> published on{" "}
          {formatDate(answerKey.data.publishedAt ?? answerKey.data.uploadedAt)} ·{" "}
          {answerKey.data.totalQuestions} questions · marking +4 / −1.
        </Alert>
      )}

      {responses.status === "loading" ? (
        <LoadingState label="Loading responses" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No questions match these filters"
          description="Try a different filter, subject or search term."
          action={{
            label: "Clear filters",
            onClick: () => {
              setFilter("all");
              setSubject("all");
              setQuery("");
            },
          }}
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <div className="nv-scroll overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <caption className="sr-only">Answer key and your responses</caption>
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50/80 text-left">
                    {["Q. No", "Subject", "Topic", "Correct answer", "Your answer", "Result", "Marks", "Time"].map(
                      (h) => (
                        <th
                          key={h}
                          scope="col"
                          className="whitespace-nowrap px-4 py-3 text-2xs font-bold uppercase tracking-wider text-ink-500"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filtered.map((row) => (
                    <tr key={row.qNo} className="transition-colors hover:bg-ink-50/60">
                      <th scope="row" className="px-4 py-3 text-left font-semibold tabular text-navy-900">
                        {row.qNo}
                      </th>
                      <td className="px-4 py-3 text-ink-600">{row.subject}</td>
                      <td className="px-4 py-3 text-ink-600">{row.topic}</td>
                      <td className="px-4 py-3">
                        <OptionChip option={row.correctOption} tone="correct" />
                      </td>
                      <td className="px-4 py-3">
                        {row.markedOption ? (
                          <OptionChip
                            option={row.markedOption}
                            tone={row.status === "correct" ? "correct" : "incorrect"}
                          />
                        ) : (
                          <span className="text-xs text-ink-400">Not attempted</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ResultBadge status={row.status} />
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 font-semibold tabular",
                          row.marks > 0 ? "text-success-600" : row.marks < 0 ? "text-danger-600" : "text-ink-400",
                        )}
                      >
                        {row.marks > 0 ? `+${row.marks}` : row.marks}
                      </td>
                      <td className="px-4 py-3 tabular text-ink-500">
                        {Math.floor(row.timeSpentSec / 60)}m {row.timeSpentSec % 60}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {filtered.map((row) => (
              <li key={row.qNo}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold text-navy-900">
                        Question {row.qNo}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-500">
                        {row.subject} · {row.topic}
                      </p>
                    </div>
                    <ResultBadge status={row.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                        Correct
                      </p>
                      <div className="mt-1">
                        <OptionChip option={row.correctOption} tone="correct" />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                        Your answer
                      </p>
                      <div className="mt-1">
                        {row.markedOption ? (
                          <OptionChip
                            option={row.markedOption}
                            tone={row.status === "correct" ? "correct" : "incorrect"}
                          />
                        ) : (
                          <span className="text-xs text-ink-400">Not attempted</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 border-t border-ink-100 pt-3 text-xs text-ink-500">
                    Marks:{" "}
                    <span
                      className={cn(
                        "font-semibold",
                        row.marks > 0 ? "text-success-600" : row.marks < 0 ? "text-danger-600" : "text-ink-500",
                      )}
                    >
                      {row.marks > 0 ? `+${row.marks}` : row.marks}
                    </span>{" "}
                    · Time: {Math.floor(row.timeSpentSec / 60)}m {row.timeSpentSec % 60}s
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function OptionChip({ option, tone }: { option: string; tone: "correct" | "incorrect" }) {
  return (
    <span
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-lg text-xs font-bold",
        tone === "correct" ? "bg-success-100 text-success-700" : "bg-danger-100 text-danger-700",
      )}
    >
      {option}
    </span>
  );
}

function ResultBadge({ status }: { status: StudentResponseRow["status"] }) {
  const config = {
    correct: { tone: "success" as const, label: "Correct", Icon: CheckCircle2 },
    incorrect: { tone: "danger" as const, label: "Incorrect", Icon: XCircle },
    unattempted: { tone: "neutral" as const, label: "Skipped", Icon: MinusCircle },
  }[status];
  const { Icon } = config;
  return (
    <Badge tone={config.tone} size="sm">
      <Icon aria-hidden />
      {config.label}
    </Badge>
  );
}
