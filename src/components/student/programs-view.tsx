"use client";

import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarRange, GraduationCap, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState, ErrorState, LoadingState, StaggerGroup, StaggerItem } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { studentService } from "@/services/student.service";
import { useCourses, usePackages } from "@/hooks/use-catalogue";
import { formatDate, daysUntil } from "@/lib/format";

const TODAY = new Date();

export function ProgramsView() {
  const enrollments = useAsync(() => studentService.enrollments(), []);
  // Live catalogue - what an admin edits in Courses/Packages shows up here.
  const { courses, getCourse, status: coursesStatus } = useCourses();
  const { getPackage, status: packagesStatus } = usePackages();

  if (enrollments.status === "error") return <ErrorState onRetry={enrollments.reload} />;
  if (
    enrollments.status === "loading" ||
    !enrollments.data ||
    coursesStatus === "loading" ||
    packagesStatus === "loading"
  ) {
    return <LoadingState label="Loading your programs" />;
  }

  const active = enrollments.data.filter((e) => e.status === "active");
  const past = enrollments.data.filter((e) => e.status !== "active");
  const enrolledSlugs = new Set(enrollments.data.map((e) => e.courseSlug));
  const available = courses.filter((c) => !enrolledSlugs.has(c.slug));

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Programs"
        description="Your active enrolments, their validity and how much of each package you have used."
        breadcrumbs={[{ label: "Dashboard", href: "/student/dashboard" }, { label: "My Programs" }]}
        actions={
          <Button asChild size="md">
            <Link to="/student/packages">
              <Plus />
              Add a program
            </Link>
          </Button>
        }
      />

      {enrollments.data.length === 0 ? (
        <EmptyState
          branded
          icon={GraduationCap}
          title="You are not enrolled in any program yet"
          description="Choose a program and package to start appearing for Nirvona computer-based examinations."
          action={{ label: "Browse packages", href: "/student/packages" }}
          secondaryAction={{ label: "Compare programs", href: "/student/packages" }}
        />
      ) : (
        <>
          <section>
            <h2 className="font-display text-lg font-semibold text-navy-900">Active enrolments</h2>
            {active.length === 0 ? (
              <EmptyState
                className="mt-4"
                compact
                icon={CalendarRange}
                title="No active enrolment"
                description="All your packages have expired. Renew to continue appearing for examinations."
                action={{ label: "Renew now", href: "/student/packages" }}
              />
            ) : (
              <StaggerGroup className="mt-4 grid gap-5 lg:grid-cols-2">
                {active.map((enrollment) => {
                  const pkg = getPackage(enrollment.packageId);
                  const course = getCourse(enrollment.courseSlug);
                  const remaining = daysUntil(enrollment.endDate, TODAY);
                  return (
                    <StaggerItem key={enrollment.id}>
                      <Card className="flex h-full flex-col overflow-hidden">
                        <div className="flex items-start justify-between gap-3 border-b border-ink-100 p-5">
                          <div className="flex items-start gap-3">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 font-display text-xs font-bold text-navy-800">
                              {(course?.shortName ?? enrollment.courseName ?? "").replace("Class ", "C")}
                            </span>
                            <div className="min-w-0">
                              <h3 className="font-display text-base font-semibold text-navy-900">
                                {course?.name ?? enrollment.courseName}
                              </h3>
                              <p className="mt-0.5 text-xs text-ink-500">
                                {pkg?.durationLabel ?? enrollment.packageName} · {enrollment.id}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={enrollment.status} />
                        </div>

                        <div className="flex-1 p-5">
                          <div>
                            <div className="mb-2 flex items-center justify-between text-xs">
                              <span className="text-ink-500">Examinations completed</span>
                              <span className="font-semibold tabular text-navy-900">
                                {enrollment.testsTaken} / {enrollment.testsTotal}
                              </span>
                            </div>
                            <ProgressBar
                              value={(enrollment.testsTaken / enrollment.testsTotal) * 100}
                              tone="ember"
                              label="Examinations completed"
                            />
                          </div>

                          <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between text-xs">
                              <span className="text-ink-500">Validity remaining</span>
                              <span className="font-semibold tabular text-navy-900">
                                {remaining > 0 ? `${remaining} days` : "Expired"}
                              </span>
                            </div>
                            <ProgressBar
                              value={Math.max(
                                0,
                                Math.min(
                                  100,
                                  (remaining / ((pkg?.durationMonths ?? 12) * 30)) * 100,
                                ),
                              )}
                              tone={remaining < 30 ? "warning" : "navy"}
                              size="sm"
                              label="Validity remaining"
                            />
                          </div>

                          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-ink-100 pt-4 text-xs">
                            <div>
                              <dt className="text-ink-400">Started</dt>
                              <dd className="mt-0.5 font-semibold text-navy-900">
                                {formatDate(enrollment.startDate)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-ink-400">Valid until</dt>
                              <dd className="mt-0.5 font-semibold text-navy-900">
                                {formatDate(enrollment.endDate)}
                              </dd>
                            </div>
                          </dl>

                          {course && (
                            <ul className="mt-4 flex flex-wrap gap-1.5">
                              {(course.subjects ?? []).map((subject) => (
                                <li key={subject.code}>
                                  <Badge tone="neutral" size="sm">
                                    {subject.name}
                                  </Badge>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 border-t border-ink-100 p-5">
                          <Button asChild size="sm">
                            <Link to="/student/exams">View exams</Link>
                          </Button>
                          <Button asChild variant="secondary" size="sm">
                            <Link to={`/courses/${enrollment.courseSlug}`}>Syllabus</Link>
                          </Button>
                          <Button asChild variant="ghost" size="sm">
                            <Link to="/student/payments">Receipt</Link>
                          </Button>
                        </div>
                      </Card>
                    </StaggerItem>
                  );
                })}
              </StaggerGroup>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-semibold text-navy-900">Past enrolments</h2>
              <ul className="mt-4 space-y-3">
                {past.map((enrollment) => {
                  const pkg = getPackage(enrollment.packageId);
                  const course = getCourse(enrollment.courseSlug);
                  return (
                    <li key={enrollment.id}>
                      <Card className="flex flex-wrap items-center gap-4 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-semibold text-navy-900">
                            {course?.name ?? enrollment.courseName}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-500">
                            {pkg?.durationLabel ?? enrollment.packageName} · {formatDate(enrollment.startDate)} –{" "}
                            {formatDate(enrollment.endDate)} · {enrollment.testsTaken} exams taken
                          </p>
                        </div>
                        <StatusBadge status={enrollment.status} />
                        <Button asChild variant="secondary" size="sm">
                          <Link to={`/student/packages?course=${enrollment.courseSlug}`}>Renew</Link>
                        </Button>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}

      {available.length > 0 && (
        <section>
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="size-5 text-ember-600" aria-hidden />
            <h2 className="font-display text-lg font-semibold text-navy-900">
              Programs you can add
            </h2>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Programs run independently — results, ranks and analytics stay separate for each.
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((course) => (
              <li key={course.slug}>
                <Card interactive className="h-full p-5">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="size-4 text-ink-400" aria-hidden />
                    <h3 className="font-display text-sm font-semibold text-navy-900">
                      {course.name}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{course.tagline}</p>
                  <Button asChild variant="secondary" size="sm" className="mt-4">
                    <Link to={`/student/packages?course=${course.slug}`}>
                      View packages
                      <ArrowRight />
                    </Link>
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
