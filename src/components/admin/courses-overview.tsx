"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen, ClipboardList, Layers, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { COURSES } from "@/data/courses";
import { PACKAGES, MAX_DURATION } from "@/data/packages";
import { COURSE_SPLIT } from "@/data/payments";
import { formatNumber } from "@/lib/format";

export function CoursesOverview() {
  const totalTests = COURSES.reduce((sum, c) => sum + c.totalTests, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="The five academic programs, their paper blueprints and package duration limits."
        actions={
          <Button asChild variant="secondary" size="md">
            <Link href="/admin/packages">
              <Layers />
              Manage packages
            </Link>
          </Button>
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
          const questions = course.examPattern.reduce((s, r) => s + r.questions, 0);
          const marks = course.examPattern.reduce((s, r) => s + r.marks, 0);
          return (
            <Card key={course.slug} className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-base font-semibold text-navy-900">
                    {course.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-500">{course.tagline}</p>
                </div>
                <Badge tone={MAX_DURATION[course.slug] === 24 ? "ember" : "neutral"} size="sm">
                  Max {MAX_DURATION[course.slug] / 12}Y
                </Badge>
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
                  {questions} questions · {marks} marks · {course.examPattern.length} sections
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {course.subjects.map((subject) => (
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
                  <Link href={`/courses/${course.slug}`}>
                    Public page
                    <ArrowUpRight />
                  </Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link href="/admin/packages">Packages</Link>
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
                      {MAX_DURATION[course.slug] / 12} year
                      {MAX_DURATION[course.slug] === 24 ? "s" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
