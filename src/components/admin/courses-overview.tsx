"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, BookOpen, ClipboardList, Layers, MoreHorizontal, Pencil, Plus, Trash2, Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger,
} from "@/components/ui/dropdown";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { COURSE_SPLIT } from "@/data/payments";
import { useAsync } from "@/hooks/use-async";
import { adminService } from "@/services/admin.service";
import { formatNumber } from "@/lib/format";
import type { Course, ExamPatternRow, FAQ } from "@/types";

function linesToList(value: string): string[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

const EMPTY_DRAFT = {
  slug: "",
  name: "",
  shortName: "",
  tagline: "",
  description: "",
  maxDurationMonths: "12",
  totalTests: "0",
  accent: "navy" as Course["accent"],
  icon: "",
  status: "active",
  audience: "",
  highlights: "",
  patternNotes: "",
  examPattern: [] as ExamPatternRow[],
  faqs: [] as FAQ[],
  stats: [] as { label: string; value: string }[],
};

export function CoursesOverview() {
  const coursesAsync = useAsync(() => adminService.courses(), []);
  const packagesAsync = useAsync(() => adminService.packages(), []);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Course | null>(null);
  const [draft, setDraft] = React.useState(EMPTY_DRAFT);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Course | null>(null);

  if (coursesAsync.status === "error") return <ErrorState onRetry={coursesAsync.reload} />;
  if (coursesAsync.status === "loading" || !coursesAsync.data) return <LoadingState label="Loading courses" />;

  const COURSES = coursesAsync.data;
  const PACKAGES = packagesAsync.data ?? [];
  const totalTests = COURSES.reduce((sum, c) => sum + c.totalTests, 0);

  function openCreate() {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setFormOpen(true);
  }

  function openEdit(course: Course) {
    setEditing(course);
    setDraft({
      slug: course.slug,
      name: course.name,
      shortName: course.shortName,
      tagline: course.tagline,
      description: course.description ?? "",
      maxDurationMonths: String(course.maxDurationMonths),
      totalTests: String(course.totalTests),
      accent: course.accent,
      icon: course.icon ?? "",
      status: (course as Course & { status?: string }).status ?? "active",
      audience: (course.audience ?? []).join("\n"),
      highlights: (course.highlights ?? []).join("\n"),
      patternNotes: (course.patternNotes ?? []).join("\n"),
      examPattern: course.examPattern ?? [],
      faqs: course.faqs ?? [],
      stats: course.stats ?? [],
    });
    setFormOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.slug || !draft.name) {
      toast.error("Slug and name are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug: draft.slug,
        name: draft.name,
        shortName: draft.shortName || draft.name,
        tagline: draft.tagline || null,
        description: draft.description || null,
        maxDurationMonths: Number(draft.maxDurationMonths) || 12,
        totalTests: Number(draft.totalTests) || 0,
        accent: draft.accent,
        icon: draft.icon || null,
        status: draft.status,
        audience: linesToList(draft.audience),
        highlights: linesToList(draft.highlights),
        patternNotes: linesToList(draft.patternNotes),
        examPattern: draft.examPattern,
        faqs: draft.faqs,
        stats: draft.stats,
      };
      if (editing) {
        await adminService.updateCourse(editing.slug, payload);
      } else {
        await adminService.createCourse(payload);
      }
      coursesAsync.reload();
      setFormOpen(false);
      setEditing(null);
      toast.success(editing ? "Course updated" : "Course created", {
        description: editing
          ? "Changes are live on the public site immediately."
          : "The course is now visible on the public catalogue.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this course.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await adminService.deleteCourse(deleteTarget.slug);
      coursesAsync.reload();
      toast.success(`${deleteTarget.name} deleted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this course.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="The academic programs, their paper blueprints and package duration limits."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="md" onClick={openCreate}>
              <Plus />
              Add course
            </Button>
            <Button asChild variant="secondary" size="md">
              <Link to="/admin/packages">
                <Layers />
                Manage packages
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Programs" numericValue={COURSES.length} icon={BookOpen} accent="navy" />
        <StatCard label="Packages" numericValue={PACKAGES.length} icon={Layers} accent="royal" />
        <StatCard label="Tests per cycle" numericValue={totalTests} icon={ClipboardList} accent="ember" />
        <StatCard
          label="Enrolled students"
          numericValue={COURSE_SPLIT.reduce((s, c) => s + c.students, 0)}
          icon={Users}
          accent="success"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {COURSES.map((course) => {
          const coursePackages = PACKAGES.filter((p) => p.courseSlug === course.slug);
          const students = COURSE_SPLIT.find((c) => c.course === course.shortName)?.students ?? 0;
          const examPattern = course.examPattern ?? [];
          const questions = examPattern.reduce((s, r) => s + r.questions, 0);
          const marks = examPattern.reduce((s, r) => s + r.marks, 0);
          return (
            <Card key={course.slug} className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-base font-semibold text-navy-900">
                    {course.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-500">{course.tagline}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={course.maxDurationMonths === 24 ? "ember" : "neutral"} size="sm">
                    Max {course.maxDurationMonths / 12}Y
                  </Badge>
                  <Dropdown>
                    <DropdownTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${course.name}`}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownTrigger>
                    <DropdownContent>
                      <DropdownLabel>{course.shortName}</DropdownLabel>
                      <DropdownSeparator />
                      <DropdownItem onSelect={() => openEdit(course)}>
                        <Pencil />
                        Edit course
                      </DropdownItem>
                      <DropdownItem destructive onSelect={() => setDeleteTarget(course)}>
                        <Trash2 />
                        Delete course
                      </DropdownItem>
                    </DropdownContent>
                  </Dropdown>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-canvas p-4 text-xs">
                <div>
                  <dt className="text-ink-400">Students</dt>
                  <dd className="mt-0.5 font-display text-base font-bold tabular text-navy-900">
                    {formatNumber(students)}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-400">Packages</dt>
                  <dd className="mt-0.5 font-display text-base font-bold tabular text-navy-900">
                    {coursePackages.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-400">Tests</dt>
                  <dd className="mt-0.5 font-display text-base font-bold tabular text-navy-900">
                    {course.totalTests}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex-1">
                <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                  Paper blueprint
                </p>
                <p className="mt-1.5 text-sm text-ink-600">
                  {questions} questions · {marks} marks · {examPattern.length} sections
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {(course.subjects ?? []).map((subject) => (
                    <li key={subject.code}>
                      <Badge tone="neutral" size="sm">
                        {subject.name}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex gap-2 border-t border-ink-100 pt-4">
                <Button asChild variant="secondary" size="sm" className="flex-1">
                  <Link to={`/courses/${course.slug}`}>
                    Public page
                    <ArrowUpRight />
                  </Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link to="/admin/packages">Packages</Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-ink-100 p-5">
          <h2 className="font-display text-base font-semibold text-navy-900">
            Duration policy
          </h2>
          <p className="mt-1 text-xs text-ink-500">
            Package durations are capped by the length of the academic track. The catalogue enforces
            this — packages beyond the cap cannot be created.
          </p>
        </div>
        <div className="nv-scroll overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/70 text-left">
                {["Program", "3 Months", "6 Months", "1 Year", "2 Years", "Cap"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="whitespace-nowrap px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {COURSES.map((course) => {
                const durations = PACKAGES.filter((p) => p.courseSlug === course.slug).map(
                  (p) => p.duration,
                );
                return (
                  <tr key={course.slug}>
                    <th scope="row" className="px-5 py-3.5 text-left font-medium text-navy-900">
                      {course.name}
                    </th>
                    {(["3M", "6M", "1Y", "2Y"] as const).map((duration) => (
                      <td key={duration} className="px-5 py-3.5">
                        {durations.includes(duration) ? (
                          <Badge tone="success" size="sm">
                            Available
                          </Badge>
                        ) : (
                          <span className="text-xs text-ink-300">Not offered</span>
                        )}
                      </td>
                    ))}
                    <td className="px-5 py-3.5 font-semibold text-navy-900">
                      {course.maxDurationMonths / 12} year
                      {course.maxDurationMonths === 24 ? "s" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add course"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Changes are live on the public site immediately."
                : "New courses appear on the public catalogue once saved. Subjects and syllabus are managed separately from the curriculum authoring tools."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save}>
            <DialogBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                <Field label="Slug" htmlFor="c-slug" required hint={editing ? "Cannot be changed" : "e.g. jee, class-11"}>
                  <Input
                    id="c-slug"
                    value={draft.slug}
                    disabled={Boolean(editing)}
                    onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                  />
                </Field>
                <Field label="Name" htmlFor="c-name" required>
                  <Input
                    id="c-name"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Short name" htmlFor="c-shortName">
                  <Input
                    id="c-shortName"
                    value={draft.shortName}
                    onChange={(e) => setDraft((d) => ({ ...d, shortName: e.target.value }))}
                  />
                </Field>
                <Field label="Tagline" htmlFor="c-tagline">
                  <Input
                    id="c-tagline"
                    value={draft.tagline}
                    onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
                  />
                </Field>
              </div>

              <Field label="Description" htmlFor="c-description">
                <Textarea
                  id="c-description"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="Max duration" htmlFor="c-maxDuration">
                  <Select
                    id="c-maxDuration"
                    value={draft.maxDurationMonths}
                    onChange={(e) => setDraft((d) => ({ ...d, maxDurationMonths: e.target.value }))}
                  >
                    <option value="12">1 Year</option>
                    <option value="24">2 Years</option>
                  </Select>
                </Field>
                <Field label="Total tests" htmlFor="c-totalTests">
                  <Input
                    id="c-totalTests"
                    type="number"
                    value={draft.totalTests}
                    onChange={(e) => setDraft((d) => ({ ...d, totalTests: e.target.value }))}
                  />
                </Field>
                <Field label="Accent" htmlFor="c-accent">
                  <Select
                    id="c-accent"
                    value={draft.accent}
                    onChange={(e) => setDraft((d) => ({ ...d, accent: e.target.value as Course["accent"] }))}
                  >
                    {["navy", "royal", "ember", "saffron", "teal"].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Status" htmlFor="c-status">
                  <Select
                    id="c-status"
                    value={draft.status}
                    onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Audience" htmlFor="c-audience" hint="One per line">
                  <Textarea
                    id="c-audience"
                    rows={4}
                    value={draft.audience}
                    onChange={(e) => setDraft((d) => ({ ...d, audience: e.target.value }))}
                  />
                </Field>
                <Field label="Highlights" htmlFor="c-highlights" hint="One per line">
                  <Textarea
                    id="c-highlights"
                    rows={4}
                    value={draft.highlights}
                    onChange={(e) => setDraft((d) => ({ ...d, highlights: e.target.value }))}
                  />
                </Field>
                <Field label="Pattern notes" htmlFor="c-patternNotes" hint="One per line">
                  <Textarea
                    id="c-patternNotes"
                    rows={4}
                    value={draft.patternNotes}
                    onChange={(e) => setDraft((d) => ({ ...d, patternNotes: e.target.value }))}
                  />
                </Field>
              </div>

              <Field label="Exam pattern">
                <div className="space-y-2">
                  {draft.examPattern.map((row, i) => (
                    <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_auto] items-center gap-2">
                      <Input
                        placeholder="Section"
                        value={row.section}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            examPattern: d.examPattern.map((r, j) => (j === i ? { ...r, section: e.target.value } : r)),
                          }))
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Qs"
                        value={row.questions}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            examPattern: d.examPattern.map((r, j) => (j === i ? { ...r, questions: Number(e.target.value) || 0 } : r)),
                          }))
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Marks"
                        value={row.marks}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            examPattern: d.examPattern.map((r, j) => (j === i ? { ...r, marks: Number(e.target.value) || 0 } : r)),
                          }))
                        }
                      />
                      <Input
                        placeholder="Type"
                        value={row.type}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            examPattern: d.examPattern.map((r, j) => (j === i ? { ...r, type: e.target.value } : r)),
                          }))
                        }
                      />
                      <Input
                        placeholder="Negative"
                        value={row.negative}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            examPattern: d.examPattern.map((r, j) => (j === i ? { ...r, negative: e.target.value } : r)),
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove row"
                        onClick={() => setDraft((d) => ({ ...d, examPattern: d.examPattern.filter((_, j) => j !== i) }))}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        examPattern: [...d.examPattern, { section: "", questions: 0, marks: 0, type: "", negative: "" }],
                      }))
                    }
                  >
                    <Plus />
                    Add section
                  </Button>
                </div>
              </Field>

              <Field label="FAQs">
                <div className="space-y-2">
                  {draft.faqs.map((row, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                      <Input
                        placeholder="Question"
                        value={row.q}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, faqs: d.faqs.map((r, j) => (j === i ? { ...r, q: e.target.value } : r)) }))
                        }
                      />
                      <Input
                        placeholder="Answer"
                        value={row.a}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, faqs: d.faqs.map((r, j) => (j === i ? { ...r, a: e.target.value } : r)) }))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove FAQ"
                        onClick={() => setDraft((d) => ({ ...d, faqs: d.faqs.filter((_, j) => j !== i) }))}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setDraft((d) => ({ ...d, faqs: [...d.faqs, { q: "", a: "" }] }))}
                  >
                    <Plus />
                    Add FAQ
                  </Button>
                </div>
              </Field>

              <Field label="Stats">
                <div className="space-y-2">
                  {draft.stats.map((row, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                      <Input
                        placeholder="Label"
                        value={row.label}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, stats: d.stats.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)) }))
                        }
                      />
                      <Input
                        placeholder="Value"
                        value={row.value}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, stats: d.stats.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)) }))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove stat"
                        onClick={() => setDraft((d) => ({ ...d, stats: d.stats.filter((_, j) => j !== i) }))}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setDraft((d) => ({ ...d, stats: [...d.stats, { label: "", value: "" }] }))}
                  >
                    <Plus />
                    Add stat
                  </Button>
                </div>
              </Field>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? "Save changes" : "Add course"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name}?`}
        description="This removes the course permanently and it disappears from the public site immediately. Courses with active packages can't be deleted - delete or reassign those packages first."
        confirmLabel="Delete course"
        tone="danger"
        details={
          deleteTarget && (
            <div className="rounded-xl border border-ink-200 bg-canvas p-4 text-sm">
              <p className="font-semibold text-navy-900">{deleteTarget.name}</p>
              <p className="mt-1 text-ink-500">{deleteTarget.slug}</p>
            </div>
          )
        }
        onConfirm={confirmDelete}
      />
    </div>
  );
}
