import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Compass, Cpu, Eye, Flag, GraduationCap, HeartHandshake, Scale, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FinalCta } from "@/components/public/final-cta";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/shared/states";
import { LogoMark } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "About",
  description:
    "Nirvona Education Tech builds examination infrastructure for Indian students — computer-based testing, transparent evaluation and performance analytics.",
};

const DIFFERENTIATORS = [
  {
    icon: Scale,
    title: "We assess, we do not coach",
    body: "Nirvona is deliberately not a coaching institute. We have no incentive to tell you that you are doing well. Our only product is an honest measurement and the analysis that follows it.",
  },
  {
    icon: Eye,
    title: "Every mark is traceable",
    body: "Answer keys are published, response sheets are released and question-level marking is visible. If you want to know why you scored what you scored, the evidence is in your portal.",
  },
  {
    icon: Users,
    title: "Rank against a real cohort",
    body: "Thousands of candidates sit the same paper on the same day at supervised centres. That is what makes a percentile mean something rather than being a number on a screen.",
  },
  {
    icon: Cpu,
    title: "Exam-hall realism",
    body: "The interface, the timer, the palette, the auto-submit — all identical to national CBT examinations, because familiarity on exam day is worth marks.",
  },
];

const VALUES = [
  { title: "Clarity over comfort", body: "A student who knows exactly where they stand can act. A student who is only reassured cannot." },
  { title: "Infrastructure, not shortcuts", body: "Centres, proctoring, credential management and evaluation pipelines — the unglamorous parts done properly." },
  { title: "Data students can use", body: "Not 42 charts. The three things to fix this week, ranked by the marks they are costing." },
  { title: "Parents in the loop", body: "Scores, ranks and receipts in plain language, so families can follow the preparation without decoding jargon." },
];

const TIMELINE = [
  { year: "2023", title: "The problem", body: "Founded after watching students walk into national examinations having never once sat a real computer-based test under exam conditions." },
  { year: "2024", title: "First centres", body: "Two examination centres in Jaipur and New Delhi ran the first Nirvona CBT series for 340 candidates." },
  { year: "2025", title: "The analytics engine", body: "Topic-level tagging, percentile normalisation and the performance analysis suite went live across all programs." },
  { year: "2026", title: "Six centres, five programs", body: "12,842 students across Class 11, Class 12, Devoter, JEE and NEET, with results published within 72 hours of every examination." },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 py-16 text-white lg:py-24">
        <div aria-hidden className="absolute inset-0 grid-backdrop-dark opacity-60" />
        <div
          aria-hidden
          className="absolute -left-24 top-10 size-[28rem] rounded-full bg-royal-600/25 blur-[120px]"
        />
        <div
          aria-hidden
          className="absolute -right-24 bottom-0 size-[28rem] rounded-full bg-ember-600/20 blur-[120px]"
        />
        <div className="container-nv relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <SectionHeading
                onDark
                align="left"
                as="h1"
                eyebrow="About Nirvona"
                title="We build the examination, so students can build the preparation"
                description="Nirvona Education Tech is an examination and performance company. We run computer-based tests at supervised centres, evaluate them transparently, and return analytics precise enough to change what a student does the following week."
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/courses">
                    Explore programs
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="onDark" size="lg">
                  <Link href="/contact">Talk to our team</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl bg-white/[0.06] p-8 ring-1 ring-inset ring-white/10 backdrop-blur">
                <LogoMark size="xl" onDark />
                <p className="mt-6 font-display text-xl font-semibold leading-snug text-white">
                  &ldquo;A score is only useful when a student knows what to do with it.&rdquo;
                </p>
                <p className="mt-4 text-sm leading-relaxed text-white/60">
                  That sentence is the whole product brief. Everything Nirvona builds — the centres,
                  the interface, the evaluation pipeline, the analytics — exists to make it true.
                </p>
                <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                  {[
                    { value: "12,842", label: "Students" },
                    { value: "48", label: "CBTs run" },
                    { value: "72h", label: "To results" },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className="font-display text-xl font-bold tabular text-white">
                        {item.value}
                      </dt>
                      <dd className="mt-0.5 text-2xs text-white/50">{item.label}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section-pad bg-white">
        <div className="container-nv">
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <Card className="h-full p-8 lg:p-10">
                <span className="flex size-12 items-center justify-center rounded-xl bg-royal-50 text-royal-600 ring-1 ring-royal-100">
                  <Compass className="size-5" aria-hidden />
                </span>
                <h2 className="mt-6 font-display text-2xl font-bold text-navy-900">Our Vision</h2>
                <p className="mt-4 text-base leading-relaxed text-ink-600">
                  A country where no student walks into a life-defining examination unprepared for
                  the examination itself — where the interface, the pressure, the pacing and the
                  marking scheme are all familiar long before the day that counts.
                </p>
                <p className="mt-4 text-base leading-relaxed text-ink-600">
                  We want the phrase &ldquo;I knew the answer but ran out of time&rdquo; to become
                  rare, because it is a solvable problem and it is not a knowledge problem.
                </p>
              </Card>
            </Reveal>

            <Reveal delay={0.1}>
              <Card className="h-full p-8 lg:p-10">
                <span className="flex size-12 items-center justify-center rounded-xl bg-ember-50 text-ember-600 ring-1 ring-ember-100">
                  <Flag className="size-5" aria-hidden />
                </span>
                <h2 className="mt-6 font-display text-2xl font-bold text-navy-900">Our Mission</h2>
                <p className="mt-4 text-base leading-relaxed text-ink-600">
                  To run rigorous, affordable, computer-based examinations at scale across India —
                  and to return each student a result they can act on within 72 hours.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    "Make real exam-hall experience accessible outside metro coaching hubs",
                    "Publish every answer key and every response sheet, without exception",
                    "Report rank and percentile against a genuine, supervised cohort",
                    "Turn every result into a specific, ranked list of what to revise next",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ember-500" aria-hidden />
                      <span className="text-sm leading-relaxed text-ink-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="section-pad bg-canvas">
        <div className="container-nv">
          <SectionHeading
            eyebrow="What makes Nirvona different"
            title="Four decisions that shape the whole product"
            description="Some of these cost us revenue. We think they are the reason a Nirvona rank is worth having."
          />
          <StaggerGroup className="mt-14 grid gap-5 md:grid-cols-2">
            {DIFFERENTIATORS.map(({ icon: Icon, title, body }) => (
              <StaggerItem key={title}>
                <Card className="h-full p-6 lg:p-8">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-navy-100">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-navy-900">{title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-500">{body}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Technology + education */}
      <section className="section-pad relative overflow-hidden bg-navy-950 text-white">
        <div aria-hidden className="absolute inset-0 grid-backdrop-dark opacity-60" />
        <div className="container-nv relative">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <SectionHeading
              onDark
              align="left"
              eyebrow="Technology + education"
              title="An examination is a logistics problem before it is an academic one"
              description="Papers must be set and reviewed. Candidates must be allotted seats. Credentials must be issued securely and separately from portal logins. Responses must be captured, validated and evaluated against a published key. Results must be normalised, ranked and released on time."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "Credential isolation", body: "Exam-hall logins are generated per candidate per examination and never share a namespace with portal accounts." },
                { title: "Validated ingestion", body: "Every credential and response upload is validated for duplicates, malformed IDs and unmatched candidates before it touches a record." },
                { title: "Deterministic evaluation", body: "Scores are computed from the published answer key with the published marking scheme. Nothing is adjusted by hand." },
                { title: "Normalised ranking", body: "Percentiles are computed across the full appearing cohort using the approach used by national multi-shift examinations." },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl bg-white/[0.05] p-5 ring-1 ring-inset ring-white/10"
                >
                  <h3 className="font-display text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Student-first philosophy */}
      <section className="section-pad bg-white">
        <div className="container-nv">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <SectionHeading
              align="left"
              eyebrow="Student-first philosophy"
              title="The student is the customer, not the product"
              description="No data resale, no engagement traps, no artificially inflated scores to keep anyone feeling good. The relationship only works if the number we hand back is true."
            />
            <StaggerGroup className="grid gap-4 sm:grid-cols-2">
              {VALUES.map((value) => (
                <StaggerItem key={value.title}>
                  <div className="h-full rounded-xl border-l-2 border-ember-500 bg-canvas p-5">
                    <h3 className="font-display text-sm font-semibold text-navy-900">
                      {value.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{value.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>

          {/* Timeline */}
          <div className="mt-20">
            <h2 className="font-display text-xl font-bold text-navy-900">How we got here</h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TIMELINE.map((item, index) => (
                <li key={item.year} className="relative">
                  <span
                    aria-hidden
                    className="absolute left-0 top-3 hidden h-px w-full bg-gradient-to-r from-ink-200 to-transparent lg:block"
                  />
                  <div className="relative">
                    <span className="flex size-6 items-center justify-center rounded-full bg-navy-900 text-2xs font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="mt-4 font-display text-2xl font-extrabold tabular text-ink-200">
                      {item.year}
                    </p>
                    <h3 className="mt-1 font-display text-sm font-semibold text-navy-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-3">
            {[
              { icon: GraduationCap, stat: "5", label: "Academic programs" },
              { icon: HeartHandshake, stat: "6", label: "Examination centres" },
              { icon: Users, stat: "12,842", label: "Students enrolled" },
            ].map(({ icon: Icon, stat, label }) => (
              <Card key={label} className="flex items-center gap-4 p-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ember-50 text-ember-600">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-2xl font-bold tabular text-navy-900">{stat}</p>
                  <p className="text-sm text-ink-500">{label}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
