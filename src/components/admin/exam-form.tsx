"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAsync } from "@/hooks/use-async";
import { adminService } from "@/services/admin.service";
import { catalogueService } from "@/services/catalogue.service";
import type { Exam } from "@/types";

const EMPTY = {
  name: "",
  courseSlug: "",
  date: "",
  reportingTime: "09:00 AM",
  examTime: "10:00 AM – 01:00 PM",
  durationMinutes: "180",
  totalQuestions: "90",
  totalMarks: "360",
  centreId: "",
  status: "draft",
  syllabusScope: "",
  instructions: "",
};

function fromExam(exam?: Exam | null): typeof EMPTY {
  if (!exam) return EMPTY;
  return {
    name: exam.name,
    courseSlug: exam.courseSlug,
    // Real `date` is a full timestamp ("2026-12-01 10:00:00"); the
    // date input only wants the day.
    date: exam.date.slice(0, 10),
    reportingTime: exam.reportingTime ?? "",
    examTime: exam.examTime ?? "",
    durationMinutes: String(exam.durationMinutes ?? 180),
    totalQuestions: String(exam.totalQuestions ?? ""),
    totalMarks: String(exam.totalMarks ?? ""),
    centreId: exam.centreId ?? "",
    status: exam.status,
    syllabusScope: exam.syllabusScope ?? "",
    instructions: exam.instructions ?? "",
  };
}

export function ExamFormDialog({
  open,
  onOpenChange,
  exam,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam?: Exam | null;
  onSaved: (exam: Exam) => void;
}) {
  const courses = useAsync(() => catalogueService.listCourses(), []);
  const centres = useAsync(() => adminService.centres(), []);

  const [values, setValues] = React.useState(() => fromExam(exam));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  // Reset the form whenever the dialog is opened for a different exam. Done
  // during render (React's "adjust state on prop change" pattern) so the first
  // paint of the dialog already shows the right values.
  const formKey = `${open ? "open" : "closed"}:${exam?.id ?? "new"}`;
  const [lastFormKey, setLastFormKey] = React.useState(formKey);
  if (lastFormKey !== formKey) {
    setLastFormKey(formKey);
    setValues(fromExam(exam));
    setErrors({});
  }

  // Once real courses load, default a fresh "create" form to the first
  // one rather than leaving the required field on a blank "Select a
  // course" option.
  React.useEffect(() => {
    if (!exam && !values.courseSlug && courses.data && courses.data.length > 0) {
      setValues((prev) => ({ ...prev, courseSlug: courses.data![0].slug }));
    }
  }, [exam, values.courseSlug, courses.data]);

  function set(key: keyof typeof EMPTY, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (values.name.trim().length < 5) next.name = "Give the examination a descriptive name.";
    if (!values.courseSlug) next.courseSlug = "Assign a course.";
    if (!values.date) next.date = "Select an examination date.";
    if (!values.totalQuestions.trim()) next.totalQuestions = "Required.";
    if (!values.totalMarks.trim()) next.totalMarks = "Required.";
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const payload = {
      name: values.name,
      courseSlug: values.courseSlug,
      date: values.date,
      reportingTime: values.reportingTime || null,
      examTime: values.examTime || null,
      durationMinutes: Number(values.durationMinutes) || 180,
      totalQuestions: Number(values.totalQuestions),
      totalMarks: Number(values.totalMarks),
      centreId: values.centreId || null,
      status: values.status,
      syllabusScope: values.syllabusScope || null,
      instructions: values.instructions || null,
    };

    setSaving(true);
    try {
      const saved = exam
        ? await adminService.updateExam(exam.id, payload)
        : await adminService.createExam(payload);
      onSaved(saved);
      onOpenChange(false);
      toast.success(exam ? `${saved.name} updated` : `${saved.name} created`, {
        description: exam
          ? "Changes are live for all assigned candidates."
          : "The exam is saved as a draft until you publish it.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this exam.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{exam ? `Edit ${exam.name}` : "Create examination"}</DialogTitle>
          <DialogDescription>
            {exam
              ? "Changes apply to every candidate assigned to this examination."
              : "New examinations are created as drafts. Publish when the schedule is final."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Exam name" htmlFor="ex-name" required error={errors.name}>
                <Input
                  id="ex-name"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="CBT-06 · Full Syllabus Mock"
                  invalid={Boolean(errors.name)}
                />
              </Field>
              <Field label="Status" htmlFor="ex-status">
                <Select id="ex-status" value={values.status} onChange={(e) => set("status", e.target.value)}>
                  {[
                    { value: "draft", label: "Draft" },
                    { value: "scheduled", label: "Scheduled (published)" },
                    { value: "admit-card-available", label: "Admit cards released" },
                    { value: "completed", label: "Completed" },
                    { value: "result-published", label: "Result published" },
                  ].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Course" htmlFor="ex-course" required error={errors.courseSlug}>
              <Select
                id="ex-course"
                value={values.courseSlug}
                onChange={(e) => set("courseSlug", e.target.value)}
                invalid={Boolean(errors.courseSlug)}
                disabled={courses.status === "loading"}
              >
                {!values.courseSlug && <option value="">Select a course</option>}
                {(courses.data ?? []).map((course) => (
                  <option key={course.slug} value={course.slug}>
                    {course.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Exam date" htmlFor="ex-date" required error={errors.date}>
                <Input
                  id="ex-date"
                  type="date"
                  value={values.date}
                  onChange={(e) => set("date", e.target.value)}
                  invalid={Boolean(errors.date)}
                />
              </Field>
              <Field label="Reporting time" htmlFor="ex-report">
                <Input
                  id="ex-report"
                  value={values.reportingTime}
                  onChange={(e) => set("reportingTime", e.target.value)}
                  placeholder="09:00 AM"
                />
              </Field>
              <Field label="Exam time" htmlFor="ex-time">
                <Input
                  id="ex-time"
                  value={values.examTime}
                  onChange={(e) => set("examTime", e.target.value)}
                  placeholder="10:00 AM – 01:00 PM"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Duration (minutes)" htmlFor="ex-dur">
                <Input
                  id="ex-dur"
                  type="number"
                  value={values.durationMinutes}
                  onChange={(e) => set("durationMinutes", e.target.value)}
                />
              </Field>
              <Field label="Questions" htmlFor="ex-q" required error={errors.totalQuestions}>
                <Input
                  id="ex-q"
                  type="number"
                  value={values.totalQuestions}
                  onChange={(e) => set("totalQuestions", e.target.value)}
                  invalid={Boolean(errors.totalQuestions)}
                />
              </Field>
              <Field label="Total marks" htmlFor="ex-m" required error={errors.totalMarks}>
                <Input
                  id="ex-m"
                  type="number"
                  value={values.totalMarks}
                  onChange={(e) => set("totalMarks", e.target.value)}
                  invalid={Boolean(errors.totalMarks)}
                />
              </Field>
            </div>

            <Field
              label="Examination centre"
              htmlFor="ex-centre"
              hint={
                centres.status !== "loading" && (centres.data ?? []).length === 0
                  ? "No examination centres set up yet - the exam can still be created and a centre assigned later."
                  : undefined
              }
            >
              <Select
                id="ex-centre"
                value={values.centreId}
                onChange={(e) => set("centreId", e.target.value)}
                disabled={centres.status === "loading" || (centres.data ?? []).length === 0}
              >
                <option value="">No centre assigned yet</option>
                {(centres.data ?? []).map((centre) => (
                  <option key={centre.id} value={centre.id} disabled={centre.status !== "active"}>
                    {centre.name} ({centre.capacity} seats)
                    {centre.status !== "active" ? " — inactive" : ""}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Syllabus scope" htmlFor="ex-scope">
              <Input
                id="ex-scope"
                value={values.syllabusScope}
                onChange={(e) => set("syllabusScope", e.target.value)}
                placeholder="Complete syllabus"
              />
            </Field>

            <Field
              label="Candidate instructions"
              htmlFor="ex-inst"
              hint="One instruction per line. These print on the admit card."
            >
              <Textarea
                id="ex-inst"
                rows={5}
                value={values.instructions}
                onChange={(e) => set("instructions", e.target.value)}
                placeholder={"Report 60 minutes before the exam start time.\nCarry a printed admit card and original photo ID."}
              />
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {exam ? "Save changes" : "Create exam"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
