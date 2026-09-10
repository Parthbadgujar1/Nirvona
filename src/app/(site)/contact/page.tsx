import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { ContactForm } from "@/components/public/contact-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/shared/section-heading";
import { EXAM_CENTRES } from "@/data/exams";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the Nirvona Education Tech team for program, payment, examination or partnership enquiries.",
};

const CHANNELS = [
  { icon: Phone, label: "Call us", value: "+91 141 400 2200", href: "tel:+911414002200", note: "Mon–Sat, 9:00 AM – 7:00 PM IST" },
  { icon: Mail, label: "Email us", value: "support@nirvona.edu.in", href: "mailto:support@nirvona.edu.in", note: "Replies within one working day" },
  { icon: MessageSquare, label: "WhatsApp", value: "+91 98290 00220", href: "https://wa.me/919829000220", note: "Exam-day support until 8:00 PM" },
];

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-200 bg-navy-950 py-16 text-white lg:py-20">
        <div aria-hidden className="absolute inset-0 grid-backdrop-dark opacity-60" />
        <div className="container-nv relative">
          <SectionHeading
            onDark
            as="h1"
            align="left"
            eyebrow="Contact"
            title="Talk to the Nirvona team"
            description="Program guidance, payment queries, examination-day support or a school partnership — start here and we will route it to the right person."
            className="max-w-2xl"
          />
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container-nv">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <ContactForm />

            <div className="space-y-5">
              {CHANNELS.map(({ icon: Icon, label, value, href, note }) => (
                <Card key={label} className="flex items-start gap-4 p-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-navy-100">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                      {label}
                    </p>
                    <a
                      href={href}
                      className="mt-1 block break-words font-display text-base font-semibold text-navy-900 transition-colors hover:text-ember-600"
                    >
                      {value}
                    </a>
                    <p className="mt-1 text-xs text-ink-500">{note}</p>
                  </div>
                </Card>
              ))}

              <Card className="p-5">
                <div className="flex items-center gap-2.5">
                  <MapPin className="size-5 text-ember-600" aria-hidden />
                  <h2 className="font-display text-base font-semibold text-navy-900">
                    Registered office
                  </h2>
                </div>
                <address className="mt-3 not-italic text-sm leading-relaxed text-ink-600">
                  Nirvona Education Tech Pvt. Ltd.
                  <br />
                  Plot 44, Sector 6, Malviya Nagar Industrial Area
                  <br />
                  Jaipur, Rajasthan 302017
                  <br />
                  India
                </address>
                <p className="mt-4 flex items-center gap-2 text-xs text-ink-500">
                  <Clock className="size-3.5" aria-hidden />
                  Office hours: Monday to Saturday, 9:00 AM – 7:00 PM IST
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-canvas">
        <div className="container-nv">
          <SectionHeading
            eyebrow="Examination centres"
            title="Where Nirvona examinations are held"
            description="Centre allocation is confirmed on your admit card. Do not visit a centre without an admit card for that examination."
          />
          <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {EXAM_CENTRES.map((centre) => (
              <li key={centre.id}>
                <Card className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-display text-xs font-bold uppercase tracking-wider text-ember-600">
                      {centre.code}
                    </span>
                    <Badge tone={centre.status === "active" ? "success" : "neutral"} size="sm">
                      {centre.status === "active" ? "Active" : "Temporarily closed"}
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold leading-snug text-navy-900">
                    {centre.name}
                  </h3>
                  <address className="mt-2 flex-1 not-italic text-sm leading-relaxed text-ink-500">
                    {centre.address}
                    <br />
                    {centre.city}, {centre.state} {centre.pincode}
                  </address>
                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-ink-100 pt-4 text-xs">
                    <div>
                      <dt className="text-ink-400">Capacity</dt>
                      <dd className="mt-0.5 font-semibold tabular text-navy-900">
                        {centre.capacity}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-400">Labs</dt>
                      <dd className="mt-0.5 font-semibold tabular text-navy-900">{centre.labs}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-400">Contact</dt>
                      <dd className="mt-0.5 truncate font-semibold text-navy-900">
                        {centre.contact.replace("+91 ", "")}
                      </dd>
                    </div>
                  </dl>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
