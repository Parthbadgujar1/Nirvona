"use client";

import { KeyRound, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { CopyField } from "@/components/shared/copy-field";
import { formatDate } from "@/lib/format";
import type { AdmitCard as AdmitCardType, Exam, ExamCentre, ExamCredential, Student } from "@/types";
import { cn } from "@/lib/utils";

export function AdmitCardSheet({
  student,
  exam,
  centre,
  admitCard,
  credential,
  packageName,
  courseName,
  className,
}: {
  student: Student;
  exam: Exam;
  centre?: ExamCentre;
  admitCard: AdmitCardType;
  credential?: ExamCredential;
  packageName: string;
  courseName: string;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "print-sheet mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-navy-900 p-6 sm:p-8">
        <Logo href={null} size="md" />
        <div className="text-right">
          <p className="font-display text-lg font-bold uppercase tracking-wide text-navy-900">
            Admit Card
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            {exam.id} · {exam.name.split("· ")[1] ?? exam.name}
          </p>
          <p className="mt-2">
            <Badge tone="success" size="sm">
              {admitCard.status === "published" || admitCard.status === "sent"
                ? "VALID FOR ENTRY"
                : admitCard.status.toUpperCase()}
            </Badge>
          </p>
        </div>
      </header>

      {/* Candidate + exam */}
      <div className="grid gap-0 border-b border-ink-200 sm:grid-cols-2 sm:divide-x sm:divide-ink-200">
        <section className="p-6 sm:p-8">
          <h2 className="text-2xs font-bold uppercase tracking-[0.14em] text-ember-600">
            Candidate details
          </h2>
          <dl className="mt-4 space-y-3">
            <Row label="Candidate name" value={student.fullName} emphasis />
            <Row label="Student ID" value={student.id} mono />
            <Row label="Roll number" value={admitCard.rollNumber} mono emphasis />
            <Row label="Date of birth" value={formatDate(student.dateOfBirth)} />
            <Row label="Course" value={courseName} />
            <Row label="Package" value={packageName} />
          </dl>
        </section>

        <section className="border-t border-ink-200 p-6 sm:border-t-0 sm:p-8">
          <h2 className="text-2xs font-bold uppercase tracking-[0.14em] text-ember-600">
            Examination details
          </h2>
          <dl className="mt-4 space-y-3">
            <Row label="Examination" value={exam.name} emphasis />
            <Row label="Exam date" value={formatDate(exam.date, "full")} emphasis />
            <Row label="Reporting time" value={exam.reportingTime} />
            <Row label="Examination time" value={exam.examTime} />
            <Row label="Duration" value={`${exam.durationMinutes} minutes`} />
            <Row
              label="Pattern"
              value={`${exam.totalQuestions} questions · ${exam.totalMarks} marks`}
            />
          </dl>
        </section>
      </div>

      {/* Centre */}
      <section className="border-b border-ink-200 p-6 sm:p-8">
        <h2 className="text-2xs font-bold uppercase tracking-[0.14em] text-ember-600">
          Examination centre
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div>
            <p className="font-display text-base font-semibold text-navy-900">
              {centre?.name ?? "To be allotted"}
            </p>
            {centre && (
              <address className="mt-1 not-italic text-sm leading-relaxed text-ink-600">
                {centre.address}
                <br />
                {centre.city}, {centre.state} — {centre.pincode}
                <br />
                Centre code: <span className="font-mono font-medium">{centre.code}</span>
              </address>
            )}
          </div>
          <div className="rounded-xl bg-canvas p-4">
            <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">Seat number</p>
            <p className="mt-1 font-display text-2xl font-extrabold tabular text-navy-900">
              {admitCard.seatNo}
            </p>
            <p className="mt-1 text-xs text-ink-500">Lab {admitCard.seatNo.split("-")[0]}</p>
          </div>
        </div>
      </section>

      {/* CBT credentials — deliberately distinct */}
      <section className="border-b border-ink-200 bg-navy-950 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.14em] text-saffron-300">
            <KeyRound className="size-3.5" aria-hidden />
            CBT Login Credentials
          </h2>
          <Badge tone="onDark" size="sm">
            Exam hall only
          </Badge>
        </div>

        {credential && credential.status === "assigned" ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <CopyField tone="dark" label="Exam Login ID" value={credential.loginId} />
              <CopyField tone="dark" label="Exam Password" value={credential.password} secret />
            </div>
            <div className="mt-4 flex gap-2.5 rounded-lg bg-white/[0.06] p-3.5 ring-1 ring-inset ring-white/10">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-saffron-300" aria-hidden />
              <p className="text-xs leading-relaxed text-white/70">
                These credentials work <strong className="text-white">only</strong> on the
                examination machine at your allotted centre. They are not your Nirvona portal login
                and cannot be used to sign in to this website. Do not share them with anyone.
              </p>
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-lg bg-white/[0.06] p-5 text-center ring-1 ring-inset ring-white/10">
            <p className="text-sm font-semibold text-white">Credentials not assigned yet</p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/60">
              Your examination login is issued 48 hours before the examination. You will be notified
              the moment it appears here.
            </p>
          </div>
        )}
      </section>

      {/* Instructions */}
      <section className="p-6 sm:p-8">
        <h2 className="text-2xs font-bold uppercase tracking-[0.14em] text-ember-600">
          Important instructions
        </h2>
        <ol className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {exam.instructions.map((instruction, index) => (
            <li key={instruction} className="flex gap-2.5">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[0.5625rem] font-bold text-white">
                {index + 1}
              </span>
              <span className="text-xs leading-relaxed text-ink-600">{instruction}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t border-ink-200 pt-6">
          <div>
            <div className="h-12 w-40 border-b border-dashed border-ink-300" />
            <p className="mt-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-400">
              Candidate signature
            </p>
          </div>
          <div>
            <div className="h-12 w-40 border-b border-dashed border-ink-300" />
            <p className="mt-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-400">
              Invigilator signature
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-sm font-semibold text-navy-900">
              Nirvona Education Tech
            </p>
            <p className="mt-0.5 text-2xs text-ink-500">
              Controller of Examinations
              <br />
              Generated {admitCard.generatedAt ? formatDate(admitCard.generatedAt) : "—"}
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}

function Row({
  label,
  value,
  mono,
  emphasis,
}: {
  label: string;
  value: string;
  mono?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd
        className={cn(
          "min-w-0 break-words text-sm",
          mono && "font-mono",
          emphasis ? "font-semibold text-navy-900" : "font-medium text-ink-700",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
