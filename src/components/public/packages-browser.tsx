"use client";

import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PackageCard } from "./package-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/states";
import type { Course, Package } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Program switcher + package grid. Shared by the public /packages page
 * and the student portal's in-portal "Browse packages" page (`embedded`),
 * so a signed-in student choosing a package never has to leave the
 * portal for the marketing site.
 *
 * `?course=<slug>` preselects a program (used by "Renew" / "View
 * packages" links). The active program is derived from the live course
 * list on every render, so a course an admin deactivates or deletes
 * while the page is open can never leave the browser pointing at a
 * program that no longer exists.
 */
export function PackagesBrowser({
  courses,
  packages,
  embedded = false,
}: {
  courses: Course[];
  packages: Package[];
  embedded?: boolean;
}) {
  const [params] = useSearchParams();
  const requested = params.get("course");
  const [picked, setPicked] = React.useState<string | null>(null);

  const activeSlug =
    [picked, requested].find((slug) => slug && courses.some((c) => c.slug === slug)) ??
    courses[0]?.slug;
  const course = courses.find((c) => c.slug === activeSlug);
  const filtered = packages.filter((p) => p.courseSlug === activeSlug);

  const body = !course ? (
    <EmptyState
      branded
      title="No programs available right now"
      description="Programs and packages will appear here as soon as they are published."
    />
  ) : (
    <>
      {/* Program switcher */}
      <div
        role="tablist"
        aria-label="Select a program"
        className="nv-scroll -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
      >
        {courses.map((item) => (
          <button
            key={item.slug}
            role="tab"
            aria-selected={item.slug === activeSlug}
            onClick={() => setPicked(item.slug)}
            className={cn(
              "shrink-0 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all duration-200",
              item.slug === activeSlug
                ? "border-navy-900 bg-navy-900 text-white shadow-md"
                : "border-ink-200 bg-white text-ink-600 hover:border-navy-200 hover:text-navy-900",
            )}
          >
            {item.shortName}
          </button>
        ))}
      </div>

      <div className="mt-8 text-center">
        <h2 className="font-display text-2xl font-bold text-navy-900">{course.name}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-ink-500">
          {course.tagline}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {course.totalTests > 0 && (
            <Badge tone="navy" size="sm">
              {course.totalTests} tests to come
            </Badge>
          )}
          <Badge tone="neutral" size="sm">
            {(course.subjects ?? []).length} subjects
          </Badge>
          <Badge tone={course.maxDurationMonths >= 24 ? "ember" : "neutral"} size="sm">
            Max {course.maxDurationMonths / 12} year package
          </Badge>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlug}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "mt-12 grid items-stretch gap-6 md:grid-cols-2",
            filtered.length === 4 ? "xl:grid-cols-4" : "lg:grid-cols-3",
          )}
        >
          {filtered.length === 0 ? (
            <p className="col-span-full rounded-xl border border-dashed border-ink-200 p-8 text-center text-sm text-ink-500">
              Plans for this program will be available soon. You can already see the upcoming tests on the Test Schedule page.
            </p>
          ) : (
            filtered.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                courseName={course.shortName}
                showDetails={!embedded}
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );

  if (embedded) return <div>{body}</div>;

  return (
    <section className="section-pad bg-white">
      <div className="container-nv">{body}</div>
    </section>
  );
}
