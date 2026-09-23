import * as React from "react";
import { Clock, Mail, MapPin, MessageSquare, Phone, UserRound } from "lucide-react";
import { ContactForm } from "@/components/public/contact-form";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/section-heading";
import { usePageTitle } from "@/hooks/use-page-title";
import { useSiteSettings } from "@/hooks/use-site-settings";

export default function ContactPage() {
  usePageTitle(
    "Contact",
    "Reach the Nirvona Education Tech team for program, payment, examination or partnership enquiries.",
  );
  const site = useSiteSettings();
  const CHANNELS = [
    { icon: Phone, label: "Call us", value: site.phone, href: site.phoneHref, note: "Mon–Sat, 9:00 AM – 7:00 PM IST" },
    { icon: Mail, label: "Email us", value: site.settings.email, href: site.emailHref, note: "Replies within one working day" },
    { icon: MessageSquare, label: "WhatsApp", value: site.whatsapp, href: site.whatsappHref, note: "Exam-day support until 8:00 PM" },
  ];
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
                  {site.settings.orgName}
                  {site.addressLines.map((line) => (
                    <React.Fragment key={line}>
                      <br />
                      {line}
                    </React.Fragment>
                  ))}
                </address>
                {site.settings.contactPersonName && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-ink-600">
                    <UserRound className="size-4 text-ink-400" aria-hidden />
                    Contact person: <span className="font-semibold text-navy-900">{site.settings.contactPersonName}</span>
                  </p>
                )}
                <p className="mt-4 flex items-center gap-2 text-xs text-ink-500">
                  <Clock className="size-3.5" aria-hidden />
                  Office hours: Monday to Saturday, 9:00 AM – 7:00 PM IST
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
