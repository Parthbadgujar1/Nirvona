import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, BadgeCheck, Ban, CalendarCheck, ClipboardCheck, CreditCard,
  IdCard, KeyRound, MonitorCheck, ScanLine, ShieldCheck, Timer, TrendingUp, Trophy, UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CbtExplainer } from "@/components/public/cbt-explainer";
import { FaqSection } from "@/components/public/faq-section";
import { FinalCta } from "@/components/public/final-cta";
import { SectionHeading } from "@/components/shared/section-heading";
import { StaggerGroup, StaggerItem } from "@/components/shared/states";
import { COURSES } from "@/data/courses";

export const metadata: Metadata = {
  title: "CBT Examinations",
  description:
    "How Nirvona computer-based testing works — from registration and admit card to the examination hall, evaluation, results and performance analysis.",
};

const FLOW = [
  { icon: UserPlus, title: "Registration", body: "Create your Nirvona account with your academic details." },
  { icon: CreditCard, title: "Enrolment", body: "Choose a program and package; enrolment activates on payment." },
  { icon: IdCard, title: "Admit Card", body: "Published in your portal with centre, seat and reporting time." },
  { icon: ScanLine, title: "Exam Centre", body: "Report with your admit card and original photo ID." },
  { icon: MonitorCheck, title: "CBT Examination", body: "Log in at your allotted machine using exam credentials." },
  { icon: ClipboardCheck, title: "Evaluation", body: "Responses are matched against the published answer key." },
  { icon: Trophy, title: "Result", body: "Score, rank and percentile released within 72 hours." },
  { icon: TrendingUp, title: "Performance Analysis", body: "Topic-level diagnostics and a ranked revision plan." },
];

const BENEFITS = [
  { title: "No OMR errors", body: "Nothing is lost to a smudged bubble, a mis-shaded row or an unreadable scan. Your response is exactly what you clicked." },
  { title: "Real timing pressure", body: "A visible countdown and auto-submit train the pacing discipline that decides scores in the last thirty minutes." },
  { title: "Free navigation", body: "Jump between sections, mark questions for review and revise answers — the same freedom the real interface gives you." },
  { title: "Instant, complete capture", body: "Every response, and the time spent on it, is recorded — which is what makes topic and pacing analytics possible." },
  { title: "Faster results", body: "Digital capture removes the scanning and manual evaluation delay. Results in 72 hours, not weeks." },
  { title: "Verifiable marking", body: "Published answer key plus your full response sheet means every mark can be checked by you." },
];

const RULES = [
  "Report to the centre 60 minutes before the examination start time. Late entry is not permitted after the gate closes.",
  "Carry a printed admit card and one original government photo ID (Aadhaar, passport, driving licence or school ID).",
  "Use the exam login ID and password printed on your admit card — these work only on the examination machine.",
  "Rough sheets and a pen are provided at your seat. Do not carry your own paper into the hall.",
  "Mobile phones, smart watches, calculators, Bluetooth devices and study material are strictly prohibited.",
  "Raise your hand for the invigilator if your machine malfunctions. Do not attempt to restart it yourself.",
  "You may not leave the examination hall during the final 15 minutes of the session.",
  "The paper submits automatically when the timer reaches zero, whether or not you press submit.",
];

const INSTRUCTIONS = [
  { title: "Before the exam", items: ["Download and print your admit card at least two days early", "Locate the centre in advance — plan for traffic", "Sleep well; the paper is three hours of sustained attention", "Note your exam login ID and password from the admit card"] },
  { title: "At the centre", items: ["Complete verification at the entry desk", "Find your allotted lab and seat number", "Log in with the exam credentials when instructed", "Read the on-screen instructions page fully before the timer starts"] },
  { title: "During the exam", items: ["Use the question palette to track answered and review-marked questions", "Do not spend more than the planned time on any single question", "Watch the negative marking scheme before a blind guess", "Review marked questions in the final fifteen minutes"] },
  { title: "After the exam", items: ["The answer key is published within 24 hours", "Raise answer-key objections within the stated window", "Results and analysis are released within 72 hours", "Read your topic report before your next study block"] },
];

const CBT_FAQS = [
  { q: "Do I take the CBT at home?", a: "No. Every Nirvona CBT is an offline examination at one of our supervised examination centres. You are allotted a centre, a lab and a seat number, all printed on your admit card." },
  { q: "What are exam login credentials?", a: "A separate ID and password issued for a single examination, printed on your admit card and used only on the examination machine. They are not your Nirvona portal login and cannot be used to access your account." },
  { q: "What happens if the computer stops working mid-exam?", a: "Raise your hand for the invigilator. Your responses are saved continuously; you are moved to a spare machine and the lost time is credited to your session." },
  { q: "Can I change my exam centre?", a: "Centre change requests can be raised from the student portal up to 10 days before the examination, subject to seat availability at the requested centre." },
  { q: "Is there negative marking?", a: "Yes. All Nirvona papers carry negative marking, matching the scheme of the examination each program prepares you for. The exact scheme is on every program page and on the instructions screen before the paper begins." },
  { q: "How is the percentile calculated?", a: "Your percentile is the proportion of appearing candidates who scored at or below your score, computed across the full cohort for that examination using the normalisation approach used by national multi-shift examinations." },
  { q: "Can I see the questions I got wrong?", a: "Yes. Your full response sheet is released alongside the answer key, showing every question, the correct option, your marked option and the marks awarded." },
];

export default function CbtPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 py-16 text-white lg:py-24">
        <div aria-hidden className="absolute inset-0 grid-backdrop-dark opacity-60" />
        <div
          aria-hidden
          className="absolute right-0 top-0 size-[30rem] rounded-full bg-royal-600/25 blur-[120px]"
        />
        <div className="container-nv relative">
          <div className="max-w-3xl">
            <SectionHeading
              onDark
              align="left"
              as="h1"
              eyebrow="Computer-based testing"
              title="What is CBT — and how does a Nirvona examination work?"
              description="Written for students and parents. No jargon, no assumptions. By the end of this page you will know exactly what happens on examination day and what you receive afterwards."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  Register now
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="onDark" size="lg">
                <Link href="#rules">Read the exam rules</Link>
              </Button>
            </div>
          </div>

          <dl className="mt-14 grid gap-4 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MonitorCheck, term: "On a computer", desc: "At a supervised Nirvona centre" },
              { icon: Timer, term: "Fixed duration", desc: "Auto-submit at zero" },
              { icon: KeyRound, term: "Separate exam login", desc: "Issued on your admit card" },
              { icon: BadgeCheck, term: "Result in 72 hours", desc: "With rank and percentile" },
            ].map(({ icon: Icon, term, desc }) => (
              <div key={term} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-saffron-300" aria-hidden />
                <div>
                  <dt className="text-sm font-semibold text-white">{term}</dt>
                  <dd className="mt-0.5 text-xs text-white/55">{desc}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CbtExplainer />

      {/* Flow */}
      <section className="section-pad bg-canvas">
        <div className="container-nv">
          <SectionHeading
            eyebrow="The full journey"
            title="How Nirvona CBT works, end to end"
            description="Eight stages. You can see exactly which stage you are at in your student portal at any moment."
          />
          <StaggerGroup className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FLOW.map(({ icon: Icon, title, body }, index) => (
              <StaggerItem key={title}>
                <Card className="relative h-full p-5">
                  <span className="absolute right-4 top-4 font-display text-2xl font-extrabold text-ink-100">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-navy-100">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-sm font-semibold text-navy-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{body}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <Alert tone="info" title="Two logins, deliberately kept apart" className="mt-10">
            Your <strong>portal login</strong> (email + password) opens this website and your
            dashboard. Your <strong>exam login</strong> (ID + password on your admit card) opens the
            examination on the centre machine. Neither can be used in place of the other — that
            separation is what keeps the examination secure.
          </Alert>
        </div>
      </section>

      {/* Exam pattern by program */}
      <section className="section-pad bg-white">
        <div className="container-nv">
          <SectionHeading
            eyebrow="Exam pattern"
            title="Paper structure by program"
            description="Each program's paper mirrors the examination it prepares you for."
          />
          <div className="mt-12 overflow-hidden rounded-2xl border border-ink-200">
            <div className="nv-scroll overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50/80 text-left">
                    {["Program", "Questions", "Marks", "Duration", "Marking"].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="whitespace-nowrap px-6 py-3.5 text-2xs font-bold uppercase tracking-wider text-ink-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {COURSES.map((course) => {
                    const q = course.examPattern.reduce((s, r) => s + r.questions, 0);
                    const m = course.examPattern.reduce((s, r) => s + r.marks, 0);
                    const duration = course.patternNotes[0].match(/(\d+)\s*minutes/)?.[1] ?? "180";
                    return (
                      <tr key={course.slug} className="transition-colors hover:bg-ink-50/60">
                        <th scope="row" className="px-6 py-4 text-left">
                          <Link
                            href={`/courses/${course.slug}`}
                            className="font-semibold text-navy-900 hover:text-ember-600"
                          >
                            {course.shortName}
                          </Link>
                        </th>
                        <td className="px-6 py-4 tabular text-ink-600">{q}</td>
                        <td className="px-6 py-4 tabular text-ink-600">{m}</td>
                        <td className="px-6 py-4 tabular text-ink-600">{duration} min</td>
                        <td className="px-6 py-4 text-ink-600">
                          +4 correct · {course.examPattern[0].negative}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-pad bg-canvas">
        <div className="container-nv">
          <SectionHeading
            eyebrow="Benefits"
            title="Why a CBT beats a pen-and-paper mock"
          />
          <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <StaggerItem key={benefit.title}>
                <Card className="h-full p-6">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-success-50 text-success-600 ring-1 ring-success-100">
                    <ShieldCheck className="size-4" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold text-navy-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{benefit.body}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Rules + instructions */}
      <section id="rules" className="section-pad scroll-mt-20 bg-white">
        <div className="container-nv">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Examination rules"
                title="Read these before exam day"
                description="These rules apply at every Nirvona examination centre and are enforced without exception."
              />
              <ol className="mt-8 space-y-3">
                {RULES.map((rule, index) => (
                  <li key={rule} className="flex gap-3 rounded-xl border border-ink-200 bg-canvas p-4">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-2xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-ink-600">{rule}</span>
                  </li>
                ))}
              </ol>

              <Alert tone="warning" title="Prohibited items" className="mt-6">
                <ul className="mt-1 flex flex-wrap gap-2">
                  {["Mobile phones", "Smart watches", "Calculators", "Bluetooth devices", "Notes & books", "Bags"].map(
                    (item) => (
                      <li key={item}>
                        <Badge tone="warning" size="sm">
                          <Ban aria-hidden />
                          {item}
                        </Badge>
                      </li>
                    ),
                  )}
                </ul>
              </Alert>
            </div>

            <div>
              <SectionHeading
                align="left"
                eyebrow="Student instructions"
                title="A checklist for each stage"
              />
              <div className="mt-8 space-y-4">
                {INSTRUCTIONS.map((block) => (
                  <Card key={block.title} className="p-5">
                    <div className="flex items-center gap-2.5">
                      <CalendarCheck className="size-4 text-ember-600" aria-hidden />
                      <h3 className="font-display text-sm font-semibold text-navy-900">
                        {block.title}
                      </h3>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {block.items.map((item) => (
                        <li key={item} className="flex gap-2.5">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-300" aria-hidden />
                          <span className="text-sm leading-relaxed text-ink-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>

              <Alert tone="danger" className="mt-6" title="Unfair means policy">
                Any attempt to use unfair means results in immediate cancellation of the paper, and
                the candidate is barred from the remaining examinations in their package without
                refund.
                <AlertTriangle className="sr-only" />
              </Alert>
            </div>
          </div>
        </div>
      </section>

      <FaqSection faqs={CBT_FAQS} title="CBT questions answered" eyebrow="FAQ" className="section-pad bg-canvas" />
      <FinalCta />
    </>
  );
}
