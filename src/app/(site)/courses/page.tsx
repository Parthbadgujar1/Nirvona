import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/public/course-card";
import { FaqSection } from "@/components/public/faq-section";
import { FinalCta } from "@/components/public/final-cta";
import { SectionHeading } from "@/components/shared/section-heading";
import { COURSES } from "@/data/courses";
import { HOME_FAQS } from "@/data/site";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Class 11, Class 12, Devoter, JEE and NEET — five computer-based examination programs with all-India ranking and performance analytics.",
};

export default function CoursesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-200 bg-navy-950 py-16 text-white lg:py-20">
        <div aria-hidden className="absolute inset-0 grid-backdrop-dark opacity-60" />
        <div
          aria-hidden
          className="absolute right-0 top-0 size-[26rem] rounded-full bg-royal-600/25 blur-[110px]"
        />
        <div className="container-nv relative">
          <SectionHeading
            align="left"
            onDark
            as="h1"
            eyebrow="Programs"
            title="Choose the examination track built for your goal"
            description="Every program runs its own paper blueprint, syllabus calendar and ranking cohort. Pick one, or run two in parallel — results and analytics stay separate."
            className="max-w-3xl"
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/packages">
                See all packages
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="onDark" size="lg">
              <Link href="/cbt">How CBT works</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="section-pad bg-canvas">
        <div className="container-nv">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COURSES.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>

          <div className="mt-14 overflow-hidden rounded-2xl border border-ink-200 bg-white">
            <div className="border-b border-ink-100 bg-ink-50/70 px-6 py-4">
              <h2 className="font-display text-lg font-semibold text-navy-900">
                Program comparison
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Package duration limits are set by the length of the academic track — we do not sell
                coverage beyond it.
              </p>
            </div>
            <div className="nv-scroll overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-white text-left">
                    {["Program", "Subjects", "Tests / year", "Max package", "Paper", "Best for"].map(
                      (header) => (
                        <th
                          key={header}
                          scope="col"
                          className="whitespace-nowrap px-6 py-3 text-2xs font-bold uppercase tracking-wider text-ink-500"
                        >
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {COURSES.map((course) => (
                    <tr key={course.slug} className="transition-colors hover:bg-ink-50/60">
                      <th scope="row" className="whitespace-nowrap px-6 py-4 text-left">
                        <Link
                          href={`/courses/${course.slug}`}
                          className="font-semibold text-navy-900 hover:text-ember-600"
                        >
                          {course.name}
                        </Link>
                      </th>
                      <td className="px-6 py-4 text-ink-600">
                        {course.subjects.map((s) => s.name).join(", ")}
                      </td>
                      <td className="px-6 py-4 tabular text-ink-600">{course.stats[0].value}</td>
                      <td className="px-6 py-4 font-medium text-navy-900">
                        {course.maxDurationMonths === 24 ? "2 years" : "1 year"}
                      </td>
                      <td className="px-6 py-4 text-ink-600">
                        {course.examPattern.reduce((sum, row) => sum + row.questions, 0)} Q ·{" "}
                        {course.examPattern.reduce((sum, row) => sum + row.marks, 0)} marks
                      </td>
                      <td className="max-w-xs px-6 py-4 text-ink-600">{course.audience[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <FaqSection faqs={HOME_FAQS.slice(4)} title="Choosing a program" eyebrow="Guidance" />
      <FinalCta />
    </>
  );
}
