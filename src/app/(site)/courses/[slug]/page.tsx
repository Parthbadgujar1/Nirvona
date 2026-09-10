import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight, BookOpenCheck, CalendarRange, CheckCircle2, ClipboardList, Sparkles, Target, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PackageCard } from "@/components/public/package-card";
import { FaqSection } from "@/components/public/faq-section";
import { FinalCta } from "@/components/public/final-cta";
import { SectionHeading } from "@/components/shared/section-heading";
import { Breadcrumbs } from "@/components/shared/page-header";
import { COURSES, getCourse } from "@/data/courses";
import { packagesForCourse } from "@/data/packages";

export function generateStaticParams() {
  return COURSES.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) return { title: "Program not found" };
  return { title: course.name, description: course.description };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const packages = packagesForCourse(course.slug);
  const totalQuestions = course.examPattern.reduce((sum, row) => sum + row.questions, 0);
  const totalMarks = course.examPattern.reduce((sum, row) => sum + row.marks, 0);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-200 bg-navy-950 text-white">
        <div aria-hidden className="absolute inset-0 grid-backdrop-dark opacity-60" />
        <div
          aria-hidden
          className="absolute -right-20 top-0 size-[30rem] rounded-full bg-ember-600/20 blur-[120px]"
        />
        <div className="container-nv relative py-14 lg:py-20">
          <Breadcrumbs
            className="[&_a]:text-white/50 [&_a:hover]:text-white [&_span]:text-white"
            items={[
              { label: "Home", href: "/" },
              { label: "Programs", href: "/courses" },
              { label: course.shortName },
            ]}
          />

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="onDark" size="md">
                  {course.shortName}
                </Badge>
                <Badge tone="onDark" size="md">
                  Max {course.maxDurationMonths / 12} year package
                </Badge>
                <Badge tone="onDark" size="md">
                  {course.totalTests} CBT examinations
                </Badge>
              </div>

              <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white lg:text-[3rem]">
                {course.name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg font-medium text-saffron-300">
                {course.tagline}
              </p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70">
                {course.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="#packages">
                    View packages
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="onDark" size="lg">
                  <Link href="#syllabus">Syllabus & pattern</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 self-start lg:grid-cols-1">
              {course.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10 lg:flex lg:items-center lg:justify-between"
                >
                  <p className="text-xs text-white/55 lg:order-2 lg:text-sm">{stat.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold tabular text-white lg:order-1 lg:mt-0">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Overview + audience */}
      <section className="section-pad bg-white">
        <div className="container-nv">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Overview"
                title="What this program actually gives you"
              />
              <ul className="mt-8 space-y-4">
                {course.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-ember-50 text-ember-600">
                      <Sparkles className="size-3.5" aria-hidden />
                    </span>
                    <span className="text-sm leading-relaxed text-ink-600">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Card className="self-start p-6 lg:p-8">
              <div className="flex items-center gap-2.5">
                <Users className="size-5 text-navy-700" aria-hidden />
                <h3 className="font-display text-lg font-semibold text-navy-900">Who is it for?</h3>
              </div>
              <ul className="mt-5 space-y-3.5">
                {course.audience.map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-600" aria-hidden />
                    <span className="text-sm leading-relaxed text-ink-600">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-ink-100 pt-6">
                <h4 className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                  Subjects covered
                </h4>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {course.subjects.map((subject) => (
                    <li
                      key={subject.code}
                      className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-navy-900"
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: subject.color }}
                        aria-hidden
                      />
                      {subject.name}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Exam pattern */}
      <section id="syllabus" className="section-pad scroll-mt-20 bg-canvas">
        <div className="container-nv">
          <SectionHeading
            eyebrow="Examination pattern"
            title="How the paper is built"
            description={`${totalQuestions} questions · ${totalMarks} marks · ${course.patternNotes[0].split("·")[0].replace("Duration:", "").trim()}`}
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
              <div className="nv-scroll overflow-x-auto">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="border-b border-ink-200 bg-ink-50/80 text-left">
                      {["Section", "Questions", "Marks", "Question type", "Negative"].map((h) => (
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
                    {course.examPattern.map((row) => (
                      <tr key={row.section}>
                        <th scope="row" className="px-5 py-3.5 text-left font-semibold text-navy-900">
                          {row.section}
                        </th>
                        <td className="px-5 py-3.5 tabular text-ink-600">{row.questions}</td>
                        <td className="px-5 py-3.5 tabular text-ink-600">{row.marks}</td>
                        <td className="px-5 py-3.5 text-ink-600">{row.type}</td>
                        <td className="px-5 py-3.5 text-ink-600">{row.negative}</td>
                      </tr>
                    ))}
                    <tr className="bg-navy-50/60 font-semibold text-navy-900">
                      <th scope="row" className="px-5 py-3.5 text-left">
                        Total
                      </th>
                      <td className="px-5 py-3.5 tabular">{totalQuestions}</td>
                      <td className="px-5 py-3.5 tabular">{totalMarks}</td>
                      <td className="px-5 py-3.5" colSpan={2}>
                        Single session, computer-based
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <Card className="p-6">
              <ClipboardList className="size-5 text-ember-600" aria-hidden />
              <h3 className="mt-4 font-display text-base font-semibold text-navy-900">
                Pattern notes
              </h3>
              <ul className="mt-4 space-y-3">
                {course.patternNotes.map((note) => (
                  <li key={note} className="flex gap-2.5">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-300" aria-hidden />
                    <span className="text-sm leading-relaxed text-ink-600">{note}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Syllabus */}
          <div className="mt-14">
            <div className="flex items-center gap-2.5">
              <BookOpenCheck className="size-5 text-navy-700" aria-hidden />
              <h3 className="font-display text-xl font-bold text-navy-900">Syllabus overview</h3>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {course.syllabus.map((subject) => (
                <Card key={subject.subject} className="p-6">
                  <h4 className="font-display text-base font-semibold text-navy-900">
                    {subject.subject}
                  </h4>
                  <div className="mt-4 space-y-4">
                    {subject.units.map((unit) => (
                      <div key={unit.title}>
                        <p className="text-2xs font-bold uppercase tracking-wider text-ember-600">
                          {unit.title}
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {unit.topics.map((topic) => (
                            <li
                              key={topic}
                              className="rounded-md bg-canvas px-2 py-1 text-xs text-ink-600"
                            >
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="section-pad scroll-mt-20 bg-white">
        <div className="container-nv">
          <SectionHeading
            eyebrow="Packages"
            title={`${course.shortName} package options`}
            description={
              course.maxDurationMonths === 24
                ? "Durations from 3 months to 2 years. The 2-year package covers both academic sessions in a single enrolment."
                : `${course.shortName} is a single-session program, so packages are capped at 12 months.`
            }
          />
          <div className="mt-14 grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} courseName={course.shortName} />
            ))}
          </div>

          <div className="mt-10 grid gap-5 rounded-2xl border border-ink-200 bg-canvas p-6 sm:grid-cols-3 lg:p-8">
            <div className="flex gap-3">
              <Target className="size-5 shrink-0 text-ember-600" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-navy-900">Every package includes ranking</p>
                <p className="mt-1 text-sm text-ink-500">
                  All-India rank and percentile after every examination, regardless of duration.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CalendarRange className="size-5 shrink-0 text-ember-600" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-navy-900">Access starts on purchase</p>
                <p className="mt-1 text-sm text-ink-500">
                  Your enrolment window begins the day the payment succeeds.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ClipboardList className="size-5 shrink-0 text-ember-600" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-navy-900">Answer keys always published</p>
                <p className="mt-1 text-sm text-ink-500">
                  Full response sheet and question-level marking for every paper you attempt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-pad bg-canvas">
        <div className="container-nv">
          <SectionHeading
            eyebrow="Benefits"
            title={`Why students choose ${course.shortName}`}
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {packages[packages.length - 1].benefits.map((benefit, index) => (
              <Card key={benefit} className="p-6">
                <span className="font-display text-3xl font-extrabold text-ink-200">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{benefit}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <FaqSection faqs={course.faqs} title={`${course.shortName} — frequently asked`} />
      <FinalCta />
    </>
  );
}
