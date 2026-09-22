"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import { Download, IdCard, Info, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/page-header";
import { AdmitCardSheet } from "@/components/shared/admit-card";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { studentService } from "@/services/student.service";
import { useCourses, usePackages } from "@/hooks/use-catalogue";
import { exportRows, timestampedName } from "@/lib/export";

export function AdmitCardPage() {
  const student = useAsync(() => studentService.me(), []);
  const exams = useAsync(() => studentService.exams(), []);
  // A 404 here means "not generated yet", not a failure - admitCard()
  // resolves to `undefined` in that case rather than throwing (see
  // resolveOptional in student.service.ts), so this correctly lands in
  // "success" state with no data instead of "error".
  const admitCard = useAsync(() => studentService.admitCard(), []);
  const enrollments = useAsync(() => studentService.enrollments(), []);
  const { getCourse } = useCourses();
  const { getPackage } = usePackages();

  // The single source of truth for "is a card ready" is admitCard.data
  // itself (the backend only ever returns one, already published, or
  // nothing at all - see the comment below). `selected` is just that
  // card's own exam record, looked up by id, for the fields the card
  // needs to render (reporting time, centre, ...) that the admit-card
  // response itself doesn't carry. This used to instead require the
  // exam's OWN status to be literally "admit-card-available" - a second,
  // separate flag nothing ever set when admit cards were published, so
  // a real published card never showed here.
  const selected = admitCard.data
    ? (exams.data ?? []).find((exam) => exam.id === admitCard.data!.examId)
    : undefined;

  const centre = useAsync(
    () => (selected ? studentService.centre(selected.centreId) : Promise.resolve(undefined)),
    [selected?.centreId],
  );

  // Exam login credentials are scoped to one exam, so this can't
  // resolve until an exam is selected.
  const credential = useAsync(
    () =>
      selected && student.data
        ? studentService.examCredential(student.data.id, selected.id)
        : Promise.resolve(undefined),
    [selected?.id, student.data?.id],
  );

  const loading = [student, exams, admitCard].some((r) => r.status === "loading");
  const failed = [student, exams].find((r) => r.status === "error");

  if (failed) return <ErrorState onRetry={() => { student.reload(); exams.reload(); admitCard.reload(); }} />;
  if (loading || !student.data) return <LoadingState label="Loading your admit card" />;

  // No admit card record yet is a normal, expected state (not an
  // error) - it's rendered the same "not published yet" empty state as
  // having no eligible exam at all, below.
  const notYetAvailable = !admitCard.data || !selected;

  const activeEnrollment = enrollments.data?.find((e) => e.status === "active");
  const pkg = activeEnrollment ? getPackage(activeEnrollment.packageId) : undefined;
  const course = activeEnrollment ? getCourse(activeEnrollment.courseSlug) : undefined;

  function downloadAdmitCard() {
    if (!selected || !student.data || !admitCard.data) return;
    exportRows(
      timestampedName(`Nirvona_AdmitCard_${selected.id}_${student.data.id}`),
      [
        {
          "Student ID": student.data.id,
          "Candidate Name": student.data.fullName,
          "Roll Number": admitCard.data.rollNumber,
          Course: course?.name ?? activeEnrollment?.courseName ?? "—",
          Package: pkg?.name ?? activeEnrollment?.packageName ?? "—",
          Exam: selected.name,
          "Exam Date": selected.date,
          "Reporting Time": selected.reportingTime,
          "Exam Time": selected.examTime,
          Centre: centre.data?.name ?? "—",
          "Centre Address": centre.data ? `${centre.data.address}, ${centre.data.city}` : "—",
          "Seat No": admitCard.data.seatNo,
          "Exam Login ID": credential.data?.loginId ?? "Not assigned",
        },
      ],
      [
        { key: "Student ID", header: "Student ID" },
        { key: "Candidate Name", header: "Candidate Name" },
        { key: "Roll Number", header: "Roll Number" },
        { key: "Course", header: "Course" },
        { key: "Package", header: "Package" },
        { key: "Exam", header: "Exam" },
        { key: "Exam Date", header: "Exam Date" },
        { key: "Reporting Time", header: "Reporting Time" },
        { key: "Exam Time", header: "Exam Time" },
        { key: "Centre", header: "Centre" },
        { key: "Centre Address", header: "Centre Address" },
        { key: "Seat No", header: "Seat No" },
        { key: "Exam Login ID", header: "Exam Login ID" },
      ],
    );
    toast.success("Admit card details downloaded", {
      description: "Use Print for the full A4 admit card.",
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admit Card"
        description="Your entry pass to the examination centre. Carry a printed copy and one original photo ID."
        breadcrumbs={[{ label: "Dashboard", href: "/student/dashboard" }, { label: "Admit Card" }]}
        className="no-print"
        actions={
          selected && (
            <>
              <Button variant="secondary" size="md" onClick={() => window.print()}>
                <Printer />
                Print Admit Card
              </Button>
              <Button size="md" onClick={downloadAdmitCard}>
                <Download />
                Download Admit Card
              </Button>
            </>
          )
        }
      />

      {notYetAvailable ? (
        <EmptyState
          branded
          icon={IdCard}
          title="Admit card not published yet"
          description="Admit cards are published in your portal 7 days before each examination. You will be notified by email, WhatsApp and in your portal the moment yours is available."
          action={{ label: "View my exams", href: "/student/exams" }}
          secondaryAction={{ label: "Read exam-day instructions", href: "/cbt" }}
        />
      ) : (
        <>
          <Alert tone="warning" className="no-print" title="Before you leave for the centre">
            <ul className="mt-1 grid gap-1 sm:grid-cols-2">
              <li>Print this admit card — a screen copy is not accepted at the gate.</li>
              <li>Carry one original government photo ID.</li>
              <li>Report by {selected?.reportingTime} — late entry is not permitted.</li>
              <li>Your exam login works only on the centre machine.</li>
            </ul>
          </Alert>

          {selected && admitCard.data && (
            <AdmitCardSheet
              student={student.data}
              exam={selected}
              centre={centre.data}
              admitCard={admitCard.data}
              credential={credential.data}
              packageName={pkg?.name ?? activeEnrollment?.packageName ?? "—"}
              courseName={course?.name ?? activeEnrollment?.courseName ?? "—"}
            />
          )}

          <p className="no-print flex items-start gap-2 text-xs text-ink-500">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Facing an issue with your admit card or centre allocation?{" "}
            <Link to="/student/support" className="font-semibold text-royal-700 hover:underline">
              Contact support
            </Link>{" "}
            at least 5 days before the examination.
          </p>
        </>
      )}
    </div>
  );
}
