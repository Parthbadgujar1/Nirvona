"use client";

import Link from "next/link";
import { ArrowRight, Target, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";
import { Counter } from "@/components/shared/counter";
import { Reveal } from "@/components/shared/states";
import { ScoreTrendChart, SubjectComparisonChart } from "@/components/charts";
import { PERFORMANCE, LATEST_RESULT } from "@/data/results";

export function AnalyticsPreview() {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-nv">
        <SectionHeading
          eyebrow="Performance analytics"
          title="Your result is where the work starts"
          description="This is the real analytics view every Nirvona student gets after a CBT — score, rank, percentile, accuracy and subject performance, all in one place."
        />

        <Reveal className="mt-14">
          <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-lg">
            {/* Summary strip */}
            <div className="grid divide-y divide-ink-100 border-b border-ink-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
              <SummaryTile
                label="Score"
                value={<><Counter value={LATEST_RESULT.score} /><span className="text-lg text-ink-400"> / 360</span></>}
                foot={`${LATEST_RESULT.percentage}%`}
                tone="ember"
              />
              <SummaryTile
                label="All-India rank"
                value={<>#<Counter value={LATEST_RESULT.rank} /></>}
                foot={`of ${LATEST_RESULT.totalCandidates.toLocaleString("en-IN")} candidates`}
                icon={Trophy}
                tone="navy"
              />
              <SummaryTile
                label="Percentile"
                value={<Counter value={LATEST_RESULT.percentile} decimals={1} />}
                foot="Top 3.2% of the cohort"
                icon={TrendingUp}
                tone="royal"
              />
              <SummaryTile
                label="Accuracy"
                value={<><Counter value={LATEST_RESULT.accuracy} decimals={1} />%</>}
                foot={`${LATEST_RESULT.correct} correct · ${LATEST_RESULT.incorrect} incorrect`}
                icon={Target}
                tone="success"
              />
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-2 lg:p-6">
              <div>
                <h3 className="font-display text-sm font-semibold text-navy-900">Score trend</h3>
                <p className="mb-3 text-xs text-ink-500">
                  Your score against the cohort average and the topper, across every CBT.
                </p>
                <ScoreTrendChart data={PERFORMANCE.scoreTrend} height={244} />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-navy-900">
                  Subject performance
                </h3>
                <p className="mb-3 text-xs text-ink-500">
                  Where you are ahead of the cohort — and where the marks are leaking.
                </p>
                <SubjectComparisonChart data={PERFORMANCE.subjectComparison} height={244} />
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-ink-100 bg-navy-950 p-5 sm:flex-row sm:items-center sm:justify-between lg:p-6">
              <p className="max-w-xl text-sm leading-relaxed text-white/75">
                <span className="font-semibold text-white">Insight:</span> {PERFORMANCE.summary}
              </p>
              <Button asChild variant="onDark" size="md" className="shrink-0">
                <Link href="/student/performance">
                  Open the live dashboard
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SummaryTile({
  label,
  value,
  foot,
  icon: Icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  foot: string;
  icon?: typeof Trophy;
  tone: "ember" | "navy" | "royal" | "success";
}) {
  const tones = {
    ember: "text-ember-600",
    navy: "text-navy-800",
    royal: "text-royal-600",
    success: "text-success-600",
  };
  return (
    <div className="p-5 lg:p-6">
      <div className="flex items-center gap-2">
        <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">{label}</p>
        {Icon && <Icon className={`size-3.5 ${tones[tone]}`} aria-hidden />}
      </div>
      <p className="mt-2 font-display text-3xl font-bold leading-none tabular text-navy-900">
        {value}
      </p>
      <p className="mt-2 text-xs text-ink-500">{foot}</p>
    </div>
  );
}
