import * as React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { usePageTitle } from "@/hooks/use-page-title";
import { useSiteSettings } from "@/hooks/use-site-settings";

export interface LegalSection {
  heading: string;
  /** Paragraphs and/or bullet lists, rendered in order. */
  body: (string | string[])[];
}

const LEGAL_LINKS = [
  { to: "/terms-of-service", label: "Terms of Service" },
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/refund-policy", label: "Refund Policy" },
];

/** Shared layout for the Terms, Privacy and Refund pages. */
export function LegalPage({
  title,
  eyebrow,
  intro,
  updated,
  sections,
  highlight,
}: {
  title: string;
  eyebrow: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
  /** Optional call-out shown above the sections (e.g. the "no refunds" statement). */
  highlight?: string;
}) {
  usePageTitle(title, intro);
  const site = useSiteSettings();

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-200 bg-navy-950 py-14 text-white lg:py-16">
        <div aria-hidden className="absolute inset-0 grid-backdrop-dark opacity-60" />
        <div className="container-nv relative">
          <SectionHeading onDark as="h1" align="left" eyebrow={eyebrow} title={title} description={intro} className="max-w-3xl" />
          <p className="mt-4 text-xs text-white/60">Last updated: {updated}</p>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container-nv">
          <div className="grid gap-10 lg:grid-cols-[1fr_16rem] lg:gap-14">
            <article className="max-w-3xl">
              {highlight && (
                <div className="mb-8 rounded-xl border border-ember-200 bg-ember-50 p-5 text-sm font-medium leading-relaxed text-ember-800">
                  {highlight}
                </div>
              )}
              {sections.map((section, i) => (
                <section key={section.heading} className="mb-9">
                  <h2 className="font-display text-xl font-bold text-navy-900">
                    {i + 1}. {section.heading}
                  </h2>
                  <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-ink-600">
                    {section.body.map((block, j) =>
                      Array.isArray(block) ? (
                        <ul key={j} className="list-disc space-y-1.5 pl-5">
                          {block.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p key={j}>{block}</p>
                      ),
                    )}
                  </div>
                </section>
              ))}
            </article>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-ink-200 bg-canvas p-5">
                <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">Questions?</p>
                <ul className="mt-3 space-y-2.5 text-sm text-ink-600">
                  <li className="flex items-start gap-2">
                    <Mail className="mt-0.5 size-4 shrink-0 text-ember-600" aria-hidden />
                    <a href={site.emailHref} className="break-all hover:text-navy-900">{site.settings.email}</a>
                  </li>
                  <li className="flex items-start gap-2">
                    <Phone className="mt-0.5 size-4 shrink-0 text-ember-600" aria-hidden />
                    <a href={site.phoneHref} className="hover:text-navy-900">{site.phone}</a>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-ember-600" aria-hidden />
                    <span>{site.addressLines.join(", ")}</span>
                  </li>
                </ul>
              </div>
              <nav aria-label="Legal" className="rounded-xl border border-ink-200 p-5">
                <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">Policies</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {LEGAL_LINKS.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="font-medium text-royal-700 hover:underline">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
