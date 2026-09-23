"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/section-heading";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { TestScheduleTable } from "@/components/shared/test-schedule-table";
import { useAsync } from "@/hooks/use-async";
import { usePageTitle } from "@/hooks/use-page-title";
import { siteService } from "@/services/site.service";
import { cn } from "@/lib/utils";
import type { SchedulePlan } from "@/types";

const STREAMS = ["JEE", "NEET", "CET"] as const;
const LEVELS = [
  { key: "11th", label: "11th" },
  { key: "12th", label: "12th" },
  { key: "dropper", label: "Dropper" },
] as const;
const PLANS: SchedulePlan[] = ["Basic", "Pro", "Pro Max"];

export default function TestSchedulePage() {
  usePageTitle(
    "Test Schedule",
    "Every upcoming Nirvona test, by class, stream and plan — with the exact chapters each test covers.",
  );

  const [stream, setStream] = React.useState<(typeof STREAMS)[number]>("JEE");
  const [level, setLevel] = React.useState<(typeof LEVELS)[number]["key"]>("11th");
  const [tier, setTier] = React.useState<SchedulePlan>("Basic");
  const [hindi, setHindi] = React.useState(false);

  // Only the Dropper NEET batch has a Hindi-medium version.
  const hasHindi = level === "dropper" && stream === "NEET";
  const slug = `${level}-${stream.toLowerCase()}${hasHindi && hindi ? "-hindi" : ""}`;

  const schedule = useAsync(() => siteService.courseSchedule(slug, tier), [slug, tier]);
  const data = schedule.data;
  const noCalendar = data && data.tiers.length === 0;

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
            title="Nirvona test calendar"
            description="Every upcoming test for JEE, NEET and CET — by class and plan — with the exact chapters each test covers."
            className="max-w-2xl"
          />
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container-nv">
          <div className="flex flex-col gap-4 rounded-2xl border border-ink-200 bg-canvas p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Segment label="Stream">
                {STREAMS.map((s) => (
                  <SegmentButton key={s} active={s === stream} onClick={() => setStream(s)}>
                    {s}
                  </SegmentButton>
                ))}
              </Segment>
              <Segment label="Class">
                {LEVELS.map((l) => (
                  <SegmentButton key={l.key} active={l.key === level} onClick={() => setLevel(l.key)}>
                    {l.label}
                  </SegmentButton>
                ))}
              </Segment>
              <Segment label="Plan">
                {PLANS.map((p) => (
                  <SegmentButton key={p} active={p === tier} onClick={() => setTier(p)}>
                    {p}
                  </SegmentButton>
                ))}
              </Segment>
            </div>
            {hasHindi && (
              <div className="flex items-center gap-2">
                <Languages className="size-4 text-ink-400" aria-hidden />
                <Segment label="Medium">
                  <SegmentButton active={!hindi} onClick={() => setHindi(false)}>English</SegmentButton>
                  <SegmentButton active={hindi} onClick={() => setHindi(true)}>Hindi</SegmentButton>
                </Segment>
              </div>
            )}
          </div>

          {schedule.status === "loading" && !data && <LoadingState label="Loading schedule" />}
          {schedule.status === "error" && <ErrorState onRetry={schedule.reload} />}

          {noCalendar && (
            <Card className="mt-8 p-8 text-center text-sm text-ink-500">
              The test calendar for this class and stream will be announced soon.
            </Card>
          )}

          {data && !noCalendar && (
            <div className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-display text-xl font-bold text-navy-900">
                    {level === "dropper" ? "Dropper" : level} {stream} — {tier}
                    {hasHindi && hindi ? " (Hindi medium)" : ""}
                  </h2>
                  <Badge tone="royal" size="md">
                    <ClipboardList />
                    {data.tests.reduce((n, t) => n + t.testCount, 0)} tests to come
                  </Badge>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link to={`/courses/${slug}#packages`}>
                    View plans
                    <ArrowRight />
                  </Link>
                </Button>
              </div>

              <div className="mt-6">
                {data.tests.length === 0 ? (
                  <Card className="p-8 text-center text-sm text-ink-500">
                    All tests of this plan have been conducted.
                  </Card>
                ) : (
                  <TestScheduleTable tests={data.tests} />
                )}
              </div>
              <p className="mt-3 text-xs text-ink-500">
                Only tests still to come are listed. Dates and chapter coverage may be revised as the session
                progresses; your admit card is always the final word on your test day and centre.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Segment({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <div className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white p-1">{children}</div>
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
