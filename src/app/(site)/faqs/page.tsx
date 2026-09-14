import type { Metadata } from "next";
import { FaqsBrowser } from "@/components/public/faqs-browser";
import { FinalCta } from "@/components/public/final-cta";
import { SectionHeading } from "@/components/shared/section-heading";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers about Nirvona programs, packages, payments, CBT examinations, admit cards, results and analytics.",
};

export default function FaqsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-200 bg-navy-950 py-16 text-white lg:py-20">
        <div aria-hidden className="absolute inset-0 grid-backdrop-dark opacity-60" />
        <div className="container-nv relative">
          <SectionHeading
            onDark
            as="h1"
            eyebrow="Help centre"
            title="Frequently asked questions"
            description="Grouped by topic. If your question is not here, our team replies to every enquiry within one working day."
          />
        </div>
      </section>
      <FaqsBrowser />
      <FinalCta />
    </>
  );
}
