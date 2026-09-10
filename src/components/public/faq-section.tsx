import Link from "next/link";
import { MessageCircleQuestion } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";
import type { FAQ } from "@/types";

export function FaqSection({
  faqs,
  title = "Questions students and parents ask",
  eyebrow = "FAQ",
  description,
  showContact = true,
  className,
}: {
  faqs: FAQ[];
  title?: string;
  eyebrow?: string;
  description?: string;
  showContact?: boolean;
  className?: string;
}) {
  return (
    <section className={className ?? "section-pad bg-white"}>
      <div className="container-nv">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <SectionHeading
              align="left"
              eyebrow={eyebrow}
              title={title}
              description={description}
            />
            {showContact && (
              <div className="mt-8 rounded-xl border border-ink-200 bg-canvas p-5">
                <MessageCircleQuestion className="size-5 text-ember-600" aria-hidden />
                <p className="mt-3 font-display text-sm font-semibold text-navy-900">
                  Still have a question?
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                  Our team replies to every enquiry within one working day.
                </p>
                <Button asChild variant="secondary" size="sm" className="mt-4">
                  <Link href="/contact">Contact support</Link>
                </Button>
              </div>
            )}
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.q} value={`item-${index}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
