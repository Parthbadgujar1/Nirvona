"use client";

import * as React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SearchBar } from "@/components/shared/filters";
import { EmptyState } from "@/components/shared/states";
import { HOME_FAQS } from "@/data/site";
import { COURSES } from "@/data/courses";
import { cn } from "@/lib/utils";
import type { FAQ } from "@/types";

const CATEGORIES: { id: string; label: string; faqs: FAQ[] }[] = [
  { id: "general", label: "General", faqs: HOME_FAQS },
  {
    id: "payments",
    label: "Payments & receipts",
    faqs: [
      { q: "Which payment methods are accepted?", a: "UPI, debit and credit cards, netbanking and popular wallets. All payments are processed through a PCI-DSS compliant gateway — Nirvona never stores your card details." },
      { q: "When do I get my receipt?", a: "Immediately. The receipt appears on the payment success screen and is permanently available under Payments & Receipts in your student portal." },
      { q: "My payment failed but money was debited. What now?", a: "Failed transactions are auto-reversed by the gateway within 5–7 working days. Raise a support request with your order ID and we will track it with the gateway on your behalf." },
      { q: "Is GST included in the price shown?", a: "Prices shown on package cards are exclusive of GST. The 18% GST is added and shown separately at checkout before you pay." },
      { q: "Do you offer refunds?", a: "Enrolments are refundable within 7 days of purchase provided you have not appeared for a CBT examination under that package. Refunds return to the original payment method within 7–10 working days." },
    ],
  },
  {
    id: "exams",
    label: "Exams & admit cards",
    faqs: [
      { q: "When is my admit card released?", a: "Admit cards are published in your portal 7 days before the examination. You receive a portal notification, plus an email and WhatsApp message the moment yours is live." },
      { q: "My admit card says 'not published yet'. Is something wrong?", a: "No. Admit cards are generated in batches once seat allocation completes for your centre. If it has not appeared within 5 days of the examination, contact support with your student ID." },
      { q: "Where do I find my exam login credentials?", a: "They are printed on your admit card in a clearly marked CBT Login Credentials section, and are also shown in the Admit Card page of your portal." },
      { q: "Can I take the exam at a different centre?", a: "Centre change requests can be raised from the portal up to 10 days before the examination, subject to seat availability." },
      { q: "What if I miss an examination?", a: "Your enrolment continues unaffected and you keep access to the paper and the answer key, but no rank is generated for that CBT." },
    ],
  },
  {
    id: "results",
    label: "Results & analytics",
    faqs: [
      { q: "How long until results are published?", a: "The answer key is published within 24 hours and the full result within 72 hours of the examination." },
      { q: "How is rank different from percentile?", a: "Rank is your position in the cohort (#127 of 1,256). Percentile is the proportion of candidates at or below your score (96.8 means you scored above 96.8% of candidates). Percentile is the more stable measure across examinations of different sizes." },
      { q: "Can I dispute an answer key?", a: "Yes. An objection window opens with each answer key. Objections are reviewed by the subject panel, and if upheld the key is corrected and all affected results are re-evaluated automatically." },
      { q: "What is in the performance analysis?", a: "Score, rank and percentile trends, subject comparison against the cohort and topper, accuracy, time distribution, topic-level accuracy, and ranked strength/weakness/improvement lists." },
    ],
  },
  {
    id: "programs",
    label: "Programs",
    faqs: COURSES.flatMap((course) =>
      course.faqs.map((faq) => ({ q: `${course.shortName}: ${faq.q}`, a: faq.a })),
    ),
  },
];

export function FaqsBrowser() {
  const [category, setCategory] = React.useState("general");
  const [query, setQuery] = React.useState("");

  const source = query
    ? CATEGORIES.flatMap((c) => c.faqs)
    : (CATEGORIES.find((c) => c.id === category)?.faqs ?? []);

  const filtered = query
    ? source.filter(
        (faq) =>
          faq.q.toLowerCase().includes(query.toLowerCase()) ||
          faq.a.toLowerCase().includes(query.toLowerCase()),
      )
    : source;

  return (
    <section className="section-pad bg-white">
      <div className="container-nv">
        <div className="mx-auto max-w-3xl">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search all questions…"
            id="faq-search"
          />

          {!query && (
            <div className="nv-scroll mt-6 flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCategory(item.id)}
                  aria-pressed={category === item.id}
                  className={cn(
                    "shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all",
                    category === item.id
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-ink-200 bg-white text-ink-600 hover:border-navy-200 hover:text-navy-900",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {query && (
            <p className="mt-4 text-sm text-ink-500">
              {filtered.length} result{filtered.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
            </p>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              className="mt-8"
              branded
              title="No matching questions"
              description="Try a different search term, or contact our support team directly."
              action={{ label: "Contact support", href: "/contact" }}
              secondaryAction={{ label: "Clear search", onClick: () => setQuery("") }}
            />
          ) : (
            <Accordion type="single" collapsible className="mt-8 space-y-3">
              {filtered.map((faq, index) => (
                <AccordionItem key={`${faq.q}-${index}`} value={`faq-${index}`}>
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </section>
  );
}
