import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, IdCard, MapPin, Timer, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getCentre } from "@/data/exams";
import { formatDate, daysUntil } from "@/lib/format";
import type { Exam } from "@/types";
import { cn } from "@/lib/utils";

const TODAY = new Date("2026-09-05");

export function ExamCard({
  exam,
  className,
  resultHref,
}: {
  exam: Exam;
  className?: string;
  resultHref?: string;
}) {
  const centre = getCentre(exam.centreId);
  const days = daysUntil(exam.date, TODAY);
  const upcoming = days >= 0;
  const admitReady = exam.status === "admit-card-available";
  const resultReady = exam.status === "result-published";

  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 p-5">
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-navy-900">{exam.id}</p>
          <h3 className="mt-0.5 truncate text-sm text-ink-600">
            {exam.name.split("· ")[1] ?? exam.name}
          </h3>
        </div>
        <StatusBadge kind="exam" status={exam.status} />
      </div>

      <dl className="grid flex-1 gap-3 p-5 sm:grid-cols-2">
        <Row icon={CalendarDays} label="Date" value={formatDate(exam.date, "full")} />
        <Row icon={Clock} label="Reporting" value={exam.reportingTime} />
        <Row icon={Timer} label="Exam time" value={exam.examTime} />
        <Row icon={MapPin} label="Centre" value={centre ? `${centre.name.split("— ")[1]}, ${centre.city}` : "To be allotted"} />
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 p-5">
        <p className="text-xs text-ink-500">
          {exam.totalQuestions} questions · {exam.totalMarks} marks · {exam.durationMinutes} min
          {upcoming && days > 0 && (
            <span className="ml-2 font-semibold text-ember-600">in {days} days</span>
          )}
        </p>
        {admitReady ? (
          <Button asChild size="sm">
            <Link href="/student/admit-card">
              <IdCard />
              View Admit Card
            </Link>
          </Button>
        ) : resultReady ? (
          <Button asChild size="sm" variant="navy">
            <Link href={resultHref ?? `/student/results/${exam.id}`}>
              <Trophy />
              View Result
              <ArrowRight />
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="secondary">
            <Link href="/student/exams">Details</Link>
          </Button>
        )}
      </div>
    </Card>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden />
      <div className="min-w-0">
        <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium leading-snug text-navy-900">{value}</dd>
      </div>
    </div>
  );
}
