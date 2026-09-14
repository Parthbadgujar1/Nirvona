import { Card } from "@/components/ui/card";
import type { SubjectResult } from "@/types";
import { cn } from "@/lib/utils";

export function SubjectPerformance({
  subjects,
  className,
  title = "Subject-wise performance",
  description,
}: {
  subjects: SubjectResult[];
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="border-b border-ink-100 p-5">
        <h2 className="font-display text-base font-semibold text-navy-900">{title}</h2>
        {description && <p className="mt-1 text-xs text-ink-500">{description}</p>}
      </div>

      <ul className="divide-y divide-ink-100">
        {subjects.map((subject) => {
          const pct = (subject.score / subject.maxScore) * 100;
          return (
            <li key={subject.subject} className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="size-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: subject.color }}
                    aria-hidden
                  />
                  <h3 className="font-display text-sm font-semibold text-navy-900">
                    {subject.subject}
                  </h3>
                </div>
                <p className="text-sm">
                  <span className="font-display text-lg font-bold tabular text-navy-900">
                    {subject.score}
                  </span>
                  <span className="text-ink-400"> / {subject.maxScore}</span>
                  <span className="ml-2 font-semibold tabular text-ember-600">
                    {pct.toFixed(0)}%
                  </span>
                </p>
              </div>

              <div
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${subject.subject} score`}
                className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100"
              >
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: subject.color }}
                />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Correct", value: subject.correct, tone: "text-success-600" },
                  { label: "Incorrect", value: subject.incorrect, tone: "text-danger-600" },
                  { label: "Unattempted", value: subject.unattempted, tone: "text-ink-500" },
                  { label: "Accuracy", value: `${subject.accuracy}%`, tone: "text-navy-900" },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-400">
                      {item.label}
                    </dt>
                    <dd className={cn("mt-0.5 font-display text-base font-bold tabular", item.tone)}>
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-3 text-xs text-ink-500">
                {subject.timeSpentMin} minutes spent · subject percentile{" "}
                <span className="font-semibold text-navy-900">{subject.percentile}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
