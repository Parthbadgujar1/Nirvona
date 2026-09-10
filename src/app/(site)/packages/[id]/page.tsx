import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight, BadgeCheck, BookOpenCheck, CalendarRange, Check, ClipboardList, Headphones,
  Lock, ShieldCheck, Sparkles, Trophy, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FaqSection } from "@/components/public/faq-section";
import { SectionHeading } from "@/components/shared/section-heading";
import { Breadcrumbs } from "@/components/shared/page-header";
import { getCourse } from "@/data/courses";
import { PACKAGES, getPackage, packagesForCourse } from "@/data/packages";
import { formatCurrency } from "@/lib/format";
import { GST_RATE } from "@/services/checkout.service";

export function generateStaticParams() {
  return PACKAGES.map((pkg) => ({ id: pkg.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pkg = getPackage(id);
  if (!pkg) return { title: "Package not found" };
  return { title: pkg.name, description: pkg.tagline };
}

const INCLUDE_LABELS: Record<string, { label: string; icon: typeof Check }> = {
  examAccess: { label: "CBT examination access", icon: ClipboardList },
  analytics: { label: "Performance analytics suite", icon: Trophy },
  answerKey: { label: "Published answer keys & response sheet", icon: BookOpenCheck },
  doubtSupport: { label: "Doubt support", icon: Headphones },
  mentorship: { label: "1:1 mentor review", icon: BadgeCheck },
  printedMaterial: { label: "Printed revision compendium", icon: BookOpenCheck },
};

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = getPackage(id);
  if (!pkg) notFound();

  const course = getCourse(pkg.courseSlug)!;
  const siblings = packagesForCourse(pkg.courseSlug).filter((p) => p.id !== pkg.id);
  const gst = Math.round(pkg.price * GST_RATE);
  const totalQuestions = course.examPattern.reduce((sum, row) => sum + row.questions, 0);
  const totalMarks = course.examPattern.reduce((sum, row) => sum + row.marks, 0);

  return (
    <>
      <section className="border-b border-ink-200 bg-canvas py-8">
        <div className="container-nv">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Packages", href: "/packages" },
              { label: course.shortName, href: `/courses/${course.slug}` },
              { label: pkg.durationLabel },
            ]}
          />
        </div>
      </section>

      <section className="bg-white py-10 lg:py-14">
        <div className="container-nv">
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
            {/* Main column */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="navy" size="md">
                  {course.shortName}
                </Badge>
                {pkg.recommended && (
                  <Badge tone="ember" size="md">
                    <Sparkles aria-hidden />
                    Most chosen
                  </Badge>
                )}
                <Badge tone="neutral" size="md">
                  {pkg.tests} CBT examinations
                </Badge>
              </div>

              <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-navy-900 lg:text-[2.6rem]">
                {pkg.name}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-500">{pkg.tagline}</p>

              {/* Overview */}
              <div className="mt-10">
                <h2 className="font-display text-xl font-bold text-navy-900">Overview</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">
                  {course.description}
                </p>
                <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: "Duration", value: pkg.durationLabel },
                    { label: "CBT exams", value: String(pkg.tests) },
                    { label: "Subjects", value: String(course.subjects.length) },
                    { label: "Per exam", value: formatCurrency(Math.round(pkg.price / pkg.tests)) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-ink-200 bg-canvas p-4">
                      <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                        {item.label}
                      </dt>
                      <dd className="mt-1 font-display text-lg font-bold tabular text-navy-900">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Features */}
              <div className="mt-10">
                <h2 className="font-display text-xl font-bold text-navy-900">
                  What&apos;s included
                </h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {Object.entries(pkg.includes).map(([key, included]) => {
                    const meta = INCLUDE_LABELS[key];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    return (
                      <li
                        key={key}
                        className={
                          included
                            ? "flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-4"
                            : "flex items-center gap-3 rounded-xl border border-dashed border-ink-200 bg-canvas p-4 opacity-60"
                        }
                      >
                        <span
                          className={
                            included
                              ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-success-50 text-success-600"
                              : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-400"
                          }
                        >
                          {included ? <Icon className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
                        </span>
                        <span
                          className={
                            included
                              ? "text-sm font-medium text-navy-900"
                              : "text-sm text-ink-500 line-through"
                          }
                        >
                          {meta.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Benefits */}
              <div className="mt-10">
                <h2 className="font-display text-xl font-bold text-navy-900">Benefits</h2>
                <ul className="mt-5 space-y-3">
                  {pkg.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-ember-100 text-ember-700">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                      <span className="text-sm leading-relaxed text-ink-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exam pattern */}
              <div className="mt-10">
                <h2 className="font-display text-xl font-bold text-navy-900">Examination pattern</h2>
                <p className="mt-2 text-sm text-ink-500">
                  {totalQuestions} questions · {totalMarks} marks · {course.patternNotes[0]}
                </p>
                <div className="mt-5 overflow-hidden rounded-xl border border-ink-200">
                  <div className="nv-scroll overflow-x-auto">
                    <table className="w-full min-w-max text-sm">
                      <thead>
                        <tr className="border-b border-ink-200 bg-ink-50/80 text-left">
                          {["Section", "Questions", "Marks", "Type", "Negative"].map((h) => (
                            <th
                              key={h}
                              scope="col"
                              className="whitespace-nowrap px-4 py-3 text-2xs font-bold uppercase tracking-wider text-ink-500"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100 bg-white">
                        {course.examPattern.map((row) => (
                          <tr key={row.section}>
                            <th scope="row" className="px-4 py-3 text-left font-semibold text-navy-900">
                              {row.section}
                            </th>
                            <td className="px-4 py-3 tabular text-ink-600">{row.questions}</td>
                            <td className="px-4 py-3 tabular text-ink-600">{row.marks}</td>
                            <td className="px-4 py-3 text-ink-600">{row.type}</td>
                            <td className="px-4 py-3 text-ink-600">{row.negative}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Syllabus */}
              <div className="mt-10">
                <h2 className="font-display text-xl font-bold text-navy-900">Syllabus covered</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {course.syllabus.map((subject) => (
                    <Card key={subject.subject} className="p-5">
                      <h3 className="font-display text-sm font-semibold text-navy-900">
                        {subject.subject}
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {subject.units.map((unit) => (
                          <li key={unit.title} className="text-xs">
                            <span className="font-semibold text-ember-600">{unit.title}: </span>
                            <span className="text-ink-500">{unit.topics.join(", ")}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky purchase panel */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card className="overflow-hidden">
                {pkg.recommended && (
                  <div className="bg-brand-ember py-2 text-center text-2xs font-bold uppercase tracking-[0.14em] text-white">
                    Recommended package
                  </div>
                )}
                <div className="p-6">
                  <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                    {course.shortName} · {pkg.durationLabel}
                  </p>

                  <div className="mt-3 flex items-end gap-2.5">
                    <span className="font-display text-[2.5rem] font-extrabold leading-none tabular text-navy-900">
                      {formatCurrency(pkg.price)}
                    </span>
                    {pkg.originalPrice && (
                      <span className="pb-1.5 text-base font-medium tabular text-ink-400 line-through">
                        {formatCurrency(pkg.originalPrice)}
                      </span>
                    )}
                  </div>
                  {pkg.discountPercent ? (
                    <p className="mt-2">
                      <Badge tone="success" size="sm">
                        You save {formatCurrency((pkg.originalPrice ?? 0) - pkg.price)} ·{" "}
                        {pkg.discountPercent}% off
                      </Badge>
                    </p>
                  ) : null}

                  <dl className="mt-6 space-y-2.5 border-t border-ink-100 pt-5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-ink-500">Package price</dt>
                      <dd className="tabular font-medium text-navy-900">
                        {formatCurrency(pkg.price)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-500">GST (18%)</dt>
                      <dd className="tabular font-medium text-navy-900">{formatCurrency(gst)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-ink-100 pt-2.5">
                      <dt className="font-semibold text-navy-900">Total payable</dt>
                      <dd className="font-display tabular text-lg font-bold text-navy-900">
                        {formatCurrency(pkg.price + gst)}
                      </dd>
                    </div>
                  </dl>

                  <Button asChild size="lg" block className="mt-6">
                    <Link href={`/checkout?package=${pkg.id}`}>
                      Continue to Payment
                      <ArrowRight />
                    </Link>
                  </Button>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-500">
                    <Lock className="size-3" aria-hidden />
                    Secure checkout · UPI, cards & netbanking
                  </p>

                  <ul className="mt-6 space-y-2.5 border-t border-ink-100 pt-5">
                    {[
                      { icon: CalendarRange, text: `Access from purchase for ${pkg.durationMonths} months` },
                      { icon: Trophy, text: "All-India rank after every examination" },
                      { icon: ShieldCheck, text: "Admit card and exam credentials included" },
                    ].map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-start gap-2.5">
                        <Icon className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden />
                        <span className="text-xs leading-relaxed text-ink-600">{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              {siblings.length > 0 && (
                <div className="mt-5 rounded-xl border border-ink-200 bg-canvas p-5">
                  <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                    Other {course.shortName} durations
                  </p>
                  <ul className="mt-3 space-y-2">
                    {siblings.map((sibling) => (
                      <li key={sibling.id}>
                        <Link
                          href={`/packages/${sibling.id}`}
                          className="flex items-center justify-between rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm transition-colors hover:border-navy-200"
                        >
                          <span className="font-medium text-navy-900">{sibling.durationLabel}</span>
                          <span className="tabular font-semibold text-ember-600">
                            {formatCurrency(sibling.price)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      <FaqSection
        faqs={course.faqs}
        title={`${course.shortName} package questions`}
        eyebrow="Before you buy"
        className="section-pad bg-canvas"
      />

      <section className="border-t border-ink-200 bg-white py-14">
        <div className="container-nv">
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-brand-navy p-8 text-center text-white lg:flex-row lg:justify-between lg:p-10 lg:text-left">
            <div>
              <SectionHeading
                onDark
                align="left"
                as="h2"
                title="Ready to enrol?"
                description={`${pkg.name} · ${formatCurrency(pkg.price + gst)} including GST`}
                className="lg:max-w-xl"
              />
            </div>
            <Button asChild size="xl" className="shrink-0">
              <Link href={`/checkout?package=${pkg.id}`}>
                Continue to Payment
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
