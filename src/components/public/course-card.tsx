import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types";
import { cn } from "@/lib/utils";

const ACCENT_BAR = {
  navy: "from-navy-900 to-navy-600",
  royal: "from-royal-600 to-royal-400",
  ember: "from-ember-600 to-saffron-400",
  saffron: "from-saffron-500 to-saffron-300",
  teal: "from-success-600 to-success-500",
} as const;

const ACCENT_CHIP = {
  navy: "bg-navy-50 text-navy-800",
  royal: "bg-royal-50 text-royal-700",
  ember: "bg-ember-50 text-ember-700",
  saffron: "bg-saffron-100 text-saffron-600",
  teal: "bg-success-50 text-success-700",
} as const;

export function CourseCard({ course, className }: { course: Course; className?: string }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-ink-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-xl",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "block h-1.5 w-full bg-gradient-to-r",
          ACCENT_BAR[course.accent],
        )}
      />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "inline-flex items-center rounded-lg px-2.5 py-1 font-display text-xs font-bold uppercase tracking-wider",
              ACCENT_CHIP[course.accent],
            )}
          >
            {course.shortName}
          </span>
          {course.maxDurationMonths === 24 && (
            <Badge tone="neutral" size="sm">
              Up to 2 years
            </Badge>
          )}
        </div>

        <h3 className="mt-4 font-display text-xl font-bold text-navy-900">{course.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{course.tagline}</p>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-ink-100 pt-5 text-xs">
          <div>
            <dt className="flex items-center gap-1 text-ink-400">
              <ClipboardList className="size-3" aria-hidden />
              Tests
            </dt>
            <dd className="mt-1 font-display text-base font-bold tabular text-navy-900">
              {course.totalTests}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-ink-400">
              <BookOpen className="size-3" aria-hidden />
              Subjects
            </dt>
            <dd className="mt-1 font-display text-base font-bold tabular text-navy-900">
              {course.subjects.length}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-ink-400">
              <Clock className="size-3" aria-hidden />
              Max
            </dt>
            <dd className="mt-1 font-display text-base font-bold tabular text-navy-900">
              {course.maxDurationMonths / 12}Y
            </dd>
          </div>
        </dl>

        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ember-600">
          View program
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
