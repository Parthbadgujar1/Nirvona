import { Link } from "react-router-dom";
import { BookOpen, LifeBuoy, Mail, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/shared/page-header";
import { HOME_FAQS } from "@/data/site";
import { usePageTitle } from "@/hooks/use-page-title";
import { useSiteSettings } from "@/hooks/use-site-settings";


const TOPICS = [
  { title: "Admit card not visible", body: "Admit cards are published 7 days before an examination. If yours has not appeared within 5 days of the exam date, contact support with your student ID and exam code." },
  { title: "Exam credentials missing", body: "Examination login credentials are issued 48 hours before the exam. They appear on your admit card page. If they are still marked pending 24 hours before the exam, call support immediately." },
  { title: "Payment debited but order failed", body: "Failed transactions are auto-reversed by the gateway within 5–7 working days. Raise a request with your order ID and transaction time if it does not return." },
  { title: "Result not published", body: "Results are released within 72 hours of an examination. If your result is missing while others from the same exam are published, it usually means your response file is still being validated." },
  { title: "Change of examination centre", body: "Centre change requests can be raised up to 10 days before an examination, subject to seat availability at the requested centre." },
];

export default function StudentSupportPage() {
  usePageTitle("Help & Support");
  const site = useSiteSettings();
  const CHANNELS = [
    { icon: Phone, label: "Call support", value: site.phone, href: site.phoneHref, note: "Mon–Sat, 9 AM – 7 PM IST" },
    { icon: MessageSquare, label: "WhatsApp", value: site.whatsapp, href: site.whatsappHref, note: "Exam-day support until 8 PM" },
    { icon: Mail, label: "Email", value: site.settings.email, href: site.emailHref, note: "Replies within one working day" },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Support"
        description="Answers to the most common issues, and three ways to reach a human."
        breadcrumbs={[{ label: "Dashboard", href: "/student/dashboard" }, { label: "Help & Support" }]}
        actions={
          <Button asChild size="md">
            <Link to="/contact">
              <LifeBuoy />
              Raise a request
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map(({ icon: Icon, label, value, href, note }) => (
          <Card key={label} className="p-5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-navy-100">
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <p className="mt-4 text-2xs font-bold uppercase tracking-wider text-ink-400">{label}</p>
            <a
              href={href}
              className="mt-1 block break-words font-display text-sm font-semibold text-navy-900 transition-colors hover:text-ember-600"
            >
              {value}
            </a>
            <p className="mt-1 text-xs text-ink-500">{note}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2.5">
            <LifeBuoy className="size-5 text-ember-600" aria-hidden />
            <h2 className="font-display text-base font-semibold text-navy-900">Common issues</h2>
          </div>
          <Accordion type="single" collapsible className="mt-5 space-y-3">
            {TOPICS.map((topic, index) => (
              <AccordionItem key={topic.title} value={`topic-${index}`}>
                <AccordionTrigger>{topic.title}</AccordionTrigger>
                <AccordionContent>{topic.body}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2.5">
            <BookOpen className="size-5 text-royal-600" aria-hidden />
            <h2 className="font-display text-base font-semibold text-navy-900">
              General questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="mt-5 space-y-3">
            {HOME_FAQS.slice(0, 5).map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Button asChild variant="secondary" size="sm" className="mt-5">
            <Link to="/faqs">Browse the full help centre</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
