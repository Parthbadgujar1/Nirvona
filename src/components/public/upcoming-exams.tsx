import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/shared/section-heading";
import { EXAMS, getCentre } from "@/data/exams";
import { formatDate, daysUntil, formatNumber } from "@/lib/format";

const UPCOMING = EXAMS.filter((exam) =>
  ["scheduled", "admit-card-available"].includes(exam.status),
).slice(0, 3);

export function UpcomingExams() {
  return (
    <section className="section-pad bg-white">
      <div className="container-nv">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            align="left"
            eyebrow="Examination calendar"
            title="Upcoming Nirvona examinations"
            description="Every CBT is published with its date, reporting time and centre well in advance."
            className="max-w-2xl"
          />
          <Button asChild variant="secondary" size="md" className="shrink-0">
            <Link href="/cbt">
              Full exam guide
              <ArrowRight />
            </Link>
          </Button>
        </div>

        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {UPCOMING.map((exam) => {
            const centre = getCentre(exam.centreId);
            const days = daysUntil(exam.date, new Date("2026-09-05"));
            return (
              <li key={exam.id}>
                <article className="flex h-full flex-col overflow-hidden rounded-xl border border-ink-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/70 px-5 py-3">
                    <span className="font-display text-sm font-bold text-navy-900">{exam.id}</span>
                    {days > 0 ? (
                      <Badge tone={days <= 14 ? "ember" : "neutral"} size="sm">
                        in {days} days
                      </Badge>
                    ) : (
                      <Badge tone="neutral" size="sm">
                        Scheduled
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-base font-semibold leading-snug text-navy-900">
                      {exam.name.split("· ")[1] ?? exam.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-ink-500">{exam.syllabusScope}</p>

                    <dl className="mt-5 flex-1 space-y-3 text-sm">
                      <Row icon={CalendarDays} label={formatDate(exam.date, "full")} />
                      <Row icon={Clock} label={`Report ${exam.reportingTime} · ${exam.examTime}`} />
                      <Row icon={MapPin} label={`${centre?.city}, ${centre?.state}`} />
                      <Row icon={Users} label={`${formatNumber(exam.candidates)} candidates registered`} />
                    </dl>

                    <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4 text-xs">
                      <span className="text-ink-500">
                        {exam.totalQuestions} questions · {exam.totalMarks} marks
                      </span>
                      <span className="font-semibold text-navy-900">
                        {exam.durationMinutes} min
                      </span>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Row({ icon: Icon, label }: { icon: typeof Clock; label: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden />
      <span className="text-sm leading-snug text-ink-600">{label}</span>
    </div>
  );
}
