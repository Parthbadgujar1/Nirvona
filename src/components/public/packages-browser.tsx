"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PackageCard } from "./package-card";
import { Badge } from "@/components/ui/badge";
import type { Course, Package } from "@/types";
import { cn } from "@/lib/utils";

export function PackagesBrowser({
  courses,
  packages,
}: {
  courses: Course[];
  packages: Package[];
}) {
  const [active, setActive] = React.useState<Course["slug"]>("jee");
  const course = courses.find((c) => c.slug === active)!;
  const filtered = packages.filter((p) => p.courseSlug === active);

  return (
    <section className="section-pad bg-white">
      <div className="container-nv">
        {/* Program switcher */}
        <div
          role="tablist"
          aria-label="Select a program"
          className="nv-scroll -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:justify-center sm:px-0"
        >
          {courses.map((item) => (
            <button
              key={item.slug}
              role="tab"
              aria-selected={item.slug === active}
              onClick={() => setActive(item.slug)}
              className={cn(
                "shrink-0 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                item.slug === active
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
            <Badge tone="navy" size="sm">
              {course.totalTests} CBT examinations
            </Badge>
            <Badge tone="neutral" size="sm">
              {course.subjects.length} subjects
            </Badge>
            <Badge tone={course.maxDurationMonths === 24 ? "ember" : "neutral"} size="sm">
              Max {course.maxDurationMonths / 12} year package
            </Badge>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "mt-12 grid items-stretch gap-6 md:grid-cols-2",
              filtered.length === 4 ? "xl:grid-cols-4" : "lg:grid-cols-3",
            )}
          >
            {filtered.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} courseName={course.shortName} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
