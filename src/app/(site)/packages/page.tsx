import type { Metadata } from "next";
import { PackagesBrowser } from "@/components/public/packages-browser";
import { FaqSection } from "@/components/public/faq-section";
import { FinalCta } from "@/components/public/final-cta";
import { SectionHeading } from "@/components/shared/section-heading";
import { COURSES } from "@/data/courses";
import { PACKAGES } from "@/data/packages";
import { HOME_FAQS } from "@/data/site";

export const metadata: Metadata = {
  title: "Packages & Pricing",
  description:
    "Compare Nirvona CBT examination packages across Class 11, Class 12, Devoter, JEE and NEET — 3 months to 2 years.",
};

export default function PackagesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-200 bg-navy-950 py-16 text-white lg:py-20">
        <div aria-hidden className="absolute inset-0 grid-backdrop-dark opacity-60" />
        <div
          aria-hidden
          className="absolute left-1/2 top-0 size-[30rem] -translate-x-1/2 rounded-full bg-ember-600/20 blur-[120px]"
        />
        <div className="container-nv relative">
          <SectionHeading
            onDark
            as="h1"
            eyebrow="Packages"
            title="Transparent pricing. No hidden fees."
            description="Pick a program, pick a duration. Every package includes the examinations, the answer keys, the rank and the full analytics suite — the longer packages add support and mentorship."
          />
        </div>
      </section>

      <PackagesBrowser courses={COURSES} packages={PACKAGES} />

      <section className="section-pad bg-canvas">
        <div className="container-nv">
          <SectionHeading
            eyebrow="What's included"
            title="Feature comparison"
            description="Everything below is included at no extra cost within the package you choose."
          />
          <div className="mt-12 overflow-hidden rounded-2xl border border-ink-200 bg-white">
            <div className="nv-scroll overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50/80">
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-left text-2xs font-bold uppercase tracking-wider text-ink-500"
                    >
                      Feature
                    </th>
                    {["3 Months", "6 Months", "1 Year", "2 Years"].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-6 py-3.5 text-center text-2xs font-bold uppercase tracking-wider text-ink-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {[
                    ["CBT examinations at a centre", true, true, true, true],
                    ["All-India rank & percentile", true, true, true, true],
                    ["Published answer key", true, true, true, true],
                    ["Full response sheet", true, true, true, true],
                    ["Performance analytics", true, true, true, true],
                    ["Topic-level weakness report", false, true, true, true],
                    ["Doubt support", false, "48h", "24h", "12h"],
                    ["1:1 mentor review", false, false, "Quarterly", "Monthly"],
                    ["Printed revision compendium", false, false, false, true],
                    ["Guaranteed centre allocation", false, false, false, true],
                  ].map((row) => (
                    <tr key={String(row[0])} className="transition-colors hover:bg-ink-50/60">
                      <th scope="row" className="px-6 py-3.5 text-left font-medium text-navy-900">
                        {row[0]}
                      </th>
                      {row.slice(1).map((cell, index) => (
                        <td key={index} className="px-6 py-3.5 text-center">
                          {cell === true ? (
                            <span className="mx-auto flex size-5 items-center justify-center rounded-full bg-success-100 text-success-700">
                              <svg viewBox="0 0 20 20" className="size-3" fill="none" aria-hidden>
                                <path
                                  d="m5 10 3.5 3.5L15 7"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span className="sr-only">Included</span>
                            </span>
                          ) : cell === false ? (
                            <span className="text-ink-300" aria-label="Not included">
                              —
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-navy-900">{cell}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-ink-100 bg-ink-50/60 px-6 py-3 text-xs text-ink-500">
              A 2-year package is available on Class 11, JEE and NEET only. Class 12 and Devoter are
              single-session programs capped at 12 months.
            </p>
          </div>
        </div>
      </section>

      <FaqSection faqs={HOME_FAQS.slice(3)} title="Pricing & enrolment questions" eyebrow="FAQ" />
      <FinalCta />
    </>
  );
}
