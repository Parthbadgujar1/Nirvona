import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";
import { StaggerGroup, StaggerItem } from "@/components/shared/states";
import { CourseCard } from "./course-card";
import { COURSES } from "@/data/courses";

export function ProgramsSection() {
  return (
    <section className="section-pad bg-white">
      <div className="container-nv">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            align="left"
            eyebrow="Programs"
            title="Five programs. One examination system."
            description="Each program has its own paper blueprint, syllabus calendar and ranking cohort — so your rank always compares you to students preparing for the same thing."
            className="max-w-2xl"
          />
          <Button asChild variant="secondary" size="md" className="shrink-0">
            <Link href="/courses">
              All programs
              <ArrowRight />
            </Link>
          </Button>
        </div>

        <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((course) => (
            <StaggerItem key={course.slug} className="h-full">
              <CourseCard course={course} />
            </StaggerItem>
          ))}
          <StaggerItem className="h-full">
            <div className="flex h-full flex-col justify-between rounded-xl border border-navy-900 bg-brand-navy p-6 text-white">
              <div>
                <h3 className="font-display text-xl font-bold">Not sure which fits?</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/70">
                  Compare every package side by side — duration, number of examinations, analytics
                  depth and price — and pick with the numbers in front of you.
                </p>
              </div>
              <Button asChild variant="onDark" size="md" className="mt-6 self-start">
                <Link href="/packages">
                  Compare packages
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </StaggerItem>
        </StaggerGroup>
      </div>
    </section>
  );
}
