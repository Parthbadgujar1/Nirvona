"use client";

import * as React from "react";
import { CalendarDays, ChevronDown, ClipboardList, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/section-heading";
import { usePageTitle } from "@/hooks/use-page-title";
import { cn } from "@/lib/utils";
import {
  SCHEDULE_TIERS,
  SCHEDULE_STREAMS,
  classLevelsForStream,
  schedulesFor,
} from "@/data/test-schedule";
import type { ScheduleStream, ScheduleTier } from "@/types";

function formatDate(iso: string | null) {
  if (!iso) return "To be announced";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function TestSchedulePage() {
  usePageTitle(
    "Test Schedule",
    "The full Nirvona MIP test calendar — every CBT and OMR test, by class, plan and month, with chapter-wise coverage.",
  );

  const [stream, setStream] = React.useState<ScheduleStream>("JEE");
  const classLevels = classLevelsForStream(stream);
  const [classLevel, setClassLevel] = React.useState(classLevels[0]);
  const [tier, setTier] = React.useState<ScheduleTier>("Basic");
  const [expanded, setExpanded] = React.useState<number | null>(null);

  React.useEffect(() => {
    const levels = classLevelsForStream(stream);
    if (!levels.includes(classLevel)) setClassLevel(levels[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  const cohortsForCell = schedulesFor(stream, classLevel).filter((c) => c.tier === tier);
  const languages = cohortsForCell.map((c) => c.language);
  const [language, setLanguage] = React.useState<"English" | "Hindi">("English");
  React.useEffect(() => {
    if (!languages.includes(language)) setLanguage(languages[0] ?? "English");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, classLevel, tier]);

  const schedule = cohortsForCell.find((c) => c.language === language) ?? cohortsForCell[0];

  // `expanded` is keyed by sNo, which restarts at 1 in every cohort - without
  // this, switching cohorts while a row was open left an unrelated row in
  // the new table looking expanded (same sNo, different test).
  React.useEffect(() => {
    setExpanded(null);
  }, [schedule?.id]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-200 bg-navy-950 py-16 text-white lg:py-20">
        <div aria-hidden className="absolute inset-0 grid-backdrop-dark opacity-60" />
        <div className="container-nv relative">
          <SectionHeading
            onDark
            as="h1"
            align="left"
            eyebrow="Test schedule"
            title="The Nirvona MIP test calendar"
            description="Every CBT and OMR test for JEE and NEET aspirants — by class, plan and month — with the exact chapters each test covers."
            className="max-w-2xl"
          />
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container-nv">
          {/* Filters */}
          <div className="flex flex-col gap-4 rounded-2xl border border-ink-200 bg-canvas p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <SegmentGroup label="Stream">
                {SCHEDULE_STREAMS.map((s) => (
                  <SegmentButton key={s} active={s === stream} onClick={() => setStream(s)}>
                    {s}
                  </SegmentButton>
                ))}
              </SegmentGroup>
              <SegmentGroup label="Class">
                {classLevels.map((level) => (
                  <SegmentButton key={level} active={level === classLevel} onClick={() => setClassLevel(level)}>
                    {level}
                  </SegmentButton>
                ))}
              </SegmentGroup>
              <SegmentGroup label="Plan">
                {SCHEDULE_TIERS.map((t) => (
                  <SegmentButton key={t} active={t === tier} onClick={() => setTier(t)}>
                    {t}
                  </SegmentButton>
                ))}
              </SegmentGroup>
            </div>

            {languages.length > 1 && (
              <div className="flex items-center gap-2">
                <Languages className="size-4 text-ink-400" aria-hidden />
                <SegmentGroup label="Language">
                  {languages.map((lang) => (
                    <SegmentButton key={lang} active={lang === language} onClick={() => setLanguage(lang)}>
                      {lang}
                    </SegmentButton>
                  ))}
                </SegmentGroup>
              </div>
            )}
          </div>

          {!schedule ? (
            <Card className="mt-8 p-8 text-center text-sm text-ink-500">
              No test schedule is published yet for this combination.
            </Card>
          ) : (
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-xl font-bold text-navy-900">
                  {schedule.cohortLabel} — {schedule.tier}
                  {schedule.language === "Hindi" ? " (Hindi medium)" : ""}
                </h2>
                <Badge tone="royal" size="md">
                  <ClipboardList /> {schedule.testCount} tests
                </Badge>
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-ink-200 bg-white">
                <div className="nv-scroll overflow-x-auto">
                  <table className="w-full min-w-max text-sm">
                    <thead>
                      <tr className="border-b border-ink-200 bg-ink-50/80 text-left">
                        {["#", "Test", "Date", "Test No.", "Type", "Pattern", "Mode", ""].map((h) => (
                          <th
                            key={h}
                            scope="col"
                            className="whitespace-nowrap px-4 py-3 text-2xs font-bold uppercase tracking-wider text-ink-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {schedule.tests.map((test) => {
                        const hasSubjects = Object.keys(test.subjects).length > 0;
                        const isOpen = expanded === test.sNo;
                        return (
                          <React.Fragment key={test.sNo}>
                            <tr
                              className={cn(hasSubjects && "cursor-pointer hover:bg-ink-50/60")}
                              onClick={() => hasSubjects && setExpanded(isOpen ? null : test.sNo)}
                            >
                              <td className="px-4 py-3.5 tabular text-ink-500">{test.sNo}</td>
                              <th scope="row" className="px-4 py-3.5 text-left font-semibold text-navy-900">
                                {test.testName}
                              </th>
                              <td className="whitespace-nowrap px-4 py-3.5 text-ink-600">
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays className="size-3.5 text-ink-400" aria-hidden />
                                  {formatDate(test.date)}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3.5 text-ink-600">{test.testNumber || "—"}</td>
                              <td className="whitespace-nowrap px-4 py-3.5 text-ink-600">{test.testType || "—"}</td>
                              <td className="whitespace-nowrap px-4 py-3.5 text-ink-600">{test.testPattern || "—"}</td>
                              <td className="whitespace-nowrap px-4 py-3.5 text-ink-600">{test.mode || "—"}</td>
                              <td className="px-4 py-3.5">
                                {hasSubjects && (
                                  <ChevronDown
                                    className={cn("size-4 text-ink-400 transition-transform", isOpen && "rotate-180")}
                                  />
                                )}
                              </td>
                            </tr>
                            {isOpen && hasSubjects && (
                              <tr className="bg-navy-50/40">
                                <td colSpan={8} className="px-4 py-4">
                                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {Object.entries(test.subjects).map(([subject, topics]) => (
                                      <div key={subject}>
                                        <p className="text-2xs font-bold uppercase tracking-wider text-ember-600">
                                          {subject}
                                        </p>
                                        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-600">
                                          {topics}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                            {isOpen && !hasSubjects && test.note && (
                              <tr className="bg-navy-50/40">
                                <td colSpan={8} className="px-4 py-4 text-sm leading-relaxed text-ink-600">
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
              <p className="mt-3 text-xs text-ink-500">
                Dates and chapter coverage follow the published MIP planner and may be revised as the session
                progresses. Your admit card is always the final word on your test day and centre.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function SegmentGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <div className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white p-1">
        {children}
      </div>
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
        active ? "bg-navy-900 text-white" : "text-ink-600 hover:bg-ink-100",
      )}
    >
      {children}
    </button>
  );
}
