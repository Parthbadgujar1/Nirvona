"use client";

import * as React from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduledTest } from "@/types";

const SUBJECT_ORDER = ["Physics", "Chemistry", "Maths", "Mathematics", "Botany", "Zoology", "Biology"];

function sortSubjects(subjects: Record<string, string>): [string, string][] {
  return Object.entries(subjects).sort(([a], [b]) => {
    const ia = SUBJECT_ORDER.indexOf(a);
    const ib = SUBJECT_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });
}

function formatExamDate(iso: string | null) {
  if (!iso) return "Date to be announced";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Upcoming-tests table with click-to-expand chapter coverage per subject. Shared by the public page and the student portal. */
export function TestScheduleTable({ tests }: { tests: ScheduledTest[] }) {
  const [expanded, setExpanded] = React.useState<number | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
      <div className="nv-scroll overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50/80 text-left">
              {["#", "Test", "Date", "Test No.", "Type", "Pattern", "Mode", ""].map((h) => (
                <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 text-2xs font-bold uppercase tracking-wider text-ink-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {tests.map((test, index) => {
              const subjects = sortSubjects(test.subjects ?? {});
              const expandable = subjects.length > 0 || Boolean(test.note);
              const isOpen = expanded === test.sNo;
              return (
                <React.Fragment key={test.sNo}>
                  <tr
                    className={cn(expandable && "cursor-pointer hover:bg-ink-50/60")}
                    onClick={() => expandable && setExpanded(isOpen ? null : test.sNo)}
                  >
                    <td className="px-4 py-3.5 tabular text-ink-500">{index + 1}</td>
                    <th scope="row" className="px-4 py-3.5 text-left font-semibold text-navy-900">
                      {test.testName}
                      {test.testCount > 1 && <span className="ml-2 text-xs font-normal text-ink-500">({test.testCount} tests)</span>}
                    </th>
                    <td className="whitespace-nowrap px-4 py-3.5 text-ink-600">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 text-ink-400" aria-hidden />
                        {formatExamDate(test.examDate)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-ink-600">{test.testNumber || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-ink-600">{test.testType || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-ink-600">{test.testPattern || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-ink-600">{test.mode || "—"}</td>
                    <td className="px-4 py-3.5">
                      {expandable && (
                        <ChevronDown className={cn("size-4 text-ink-400 transition-transform", isOpen && "rotate-180")} />
                      )}
                    </td>
                  </tr>
                  {isOpen && subjects.length > 0 && (
                    <tr className="bg-navy-50/40">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {subjects.map(([subject, topics]) => (
                            <div key={subject}>
                              <p className="text-2xs font-bold uppercase tracking-wider text-ember-600">{subject}</p>
                              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-600">{topics}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  {isOpen && subjects.length === 0 && test.note && (
                    <tr className="bg-navy-50/40">
                      <td colSpan={8} className="whitespace-pre-line px-4 py-4 text-sm leading-relaxed text-ink-600">
                        {test.note}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
