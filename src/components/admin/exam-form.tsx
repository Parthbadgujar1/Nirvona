"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { COURSES } from "@/data/courses";
import { EXAM_CENTRES } from "@/data/exams";
import { PACKAGES } from "@/data/packages";
import type { Exam } from "@/types";

const EMPTY = {
  id: "",
  name: "",
  courseSlugs: [] as string[],
  packageScope: "all",
  date: "",
  reportingTime: "09:00 AM",
  examTime: "10:00 AM – 01:00 PM",
  durationMinutes: "180",
  totalQuestions: "90",
  totalMarks: "360",
  centreId: EXAM_CENTRES[0].id,
  status: "draft",
  syllabusScope: "",
  instructions: "",
};

function fromExam(exam?: Exam | null): typeof EMPTY {
  if (!exam) return EMPTY;
  return {
    id: exam.id,
    name: exam.name,
    courseSlugs: exam.courseSlugs,
    packageScope: "all",
    date: exam.date,
    reportingTime: exam.reportingTime,
    examTime: exam.examTime,
    durationMinutes: String(exam.durationMinutes),
    totalQuestions: String(exam.totalQuestions),
    totalMarks: String(exam.totalMarks),
    centreId: exam.centreId,
    status: exam.status,
    syllabusScope: exam.syllabusScope,
    instructions: exam.instructions.join("\n"),
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
  onSaved: (values: Record<string, unknown>) => void;
}) {
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

  function set(key: keyof typeof EMPTY, value: string | string[]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!/^[A-Z0-9-]{3,20}$/.test(values.id)) next.id = "Use an uppercase code, e.g. CBT-06.";
    if (values.name.trim().length < 5) next.name = "Give the examination a descriptive name.";
    if (values.courseSlugs.length === 0) next.courseSlugs = "Assign at least one course.";
    if (!values.date) next.date = "Select an examination date.";
    if (!values.syllabusScope.trim()) next.syllabusScope = "Describe the syllabus scope.";
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    onSaved(values);
    onOpenChange(false);
    toast.success(exam ? `${values.id} updated` : `${values.id} created`, {
      description: exam
        ? "Changes are live for all assigned candidates."
        : "The exam is saved as a draft until you publish it.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{exam ? `Edit ${exam.id}` : "Create examination"}</DialogTitle>
          <DialogDescription>
            {exam
              ? "Changes apply to every candidate assigned to this examination."
              : "New examinations are created as drafts. Publish when the schedule is final."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Exam code" htmlFor="ex-id" required error={errors.id}>
                <Input
                  id="ex-id"
                  value={values.id}
                  onChange={(e) => set("id", e.target.value.toUpperCase())}
                  placeholder="CBT-06"
                  disabled={Boolean(exam)}
                  invalid={Boolean(errors.id)}
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

            <Field label="Exam name" htmlFor="ex-name" required error={errors.name}>
              <Input
                id="ex-name"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="CBT-06 · Full Syllabus Mock"
                invalid={Boolean(errors.name)}
              />
            </Field>

            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium text-ink-700">
                Assign courses<span className="ml-0.5 text-ember-600">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {COURSES.map((course) => (
                  <label
                    key={course.slug}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-ink-200 px-3 py-2.5 text-sm transition-colors hover:border-navy-200"
                  >
                    <Checkbox
                      checked={values.courseSlugs.includes(course.slug)}
                      onCheckedChange={(checked) =>
                        set(
                          "courseSlugs",
                          checked
                            ? [...values.courseSlugs, course.slug]
                            : values.courseSlugs.filter((s) => s !== course.slug),
                        )
                      }
                      aria-label={course.name}
                    />
                    <span className="text-navy-900">{course.shortName}</span>
                  </label>
                ))}
              </div>
              {errors.courseSlugs && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-danger-600">
                  {errors.courseSlugs}
                </p>
              )}
            </fieldset>

            <Field
              label="Package scope"
              htmlFor="ex-pkg"
              hint="Restrict the examination to specific packages, or open it to all packages in the assigned courses."
            >
              <Select id="ex-pkg" value={values.packageScope} onChange={(e) => set("packageScope", e.target.value)}>
                <option value="all">All packages in the assigned courses</option>
                {PACKAGES.filter((p) => values.courseSlugs.includes(p.courseSlug)).map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name}
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
              <Field label="Questions" htmlFor="ex-q">
                <Input
                  id="ex-q"
                  type="number"
                  value={values.totalQuestions}
                  onChange={(e) => set("totalQuestions", e.target.value)}
                />
              </Field>
              <Field label="Total marks" htmlFor="ex-m">
                <Input
                  id="ex-m"
                  type="number"
                  value={values.totalMarks}
                  onChange={(e) => set("totalMarks", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Examination centre" htmlFor="ex-centre" required>
              <Select id="ex-centre" value={values.centreId} onChange={(e) => set("centreId", e.target.value)}>
                {EXAM_CENTRES.map((centre) => (
                  <option key={centre.id} value={centre.id} disabled={centre.status !== "active"}>
                    {centre.name} ({centre.capacity} seats)
                    {centre.status !== "active" ? " — inactive" : ""}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Syllabus scope" htmlFor="ex-scope" required error={errors.syllabusScope}>
              <Input
                id="ex-scope"
                value={values.syllabusScope}
                onChange={(e) => set("syllabusScope", e.target.value)}
                placeholder="Complete syllabus"
                invalid={Boolean(errors.syllabusScope)}
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
