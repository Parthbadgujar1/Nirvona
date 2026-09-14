"use client";

import {
  BarChart3, GraduationCap, Layers, MonitorCheck, ScrollText, Trophy,
} from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { StaggerGroup, StaggerItem } from "@/components/shared/states";
import { cn } from "@/lib/utils";

const REASONS = [
  {
    icon: Layers,
    title: "Structured Preparation",
    body: "A fixed examination calendar mapped to your syllabus, so you always know what is being tested next and what to revise this week.",
    accent: "royal",
  },
  {
    icon: MonitorCheck,
    title: "CBT Experience",
    body: "Every test is a real computer-based examination at a Nirvona centre — the same interface, timer, palette and pressure as the exam that matters.",
    accent: "navy",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    body: "Score, accuracy, time per question, topic-level strength and the exact marks each weakness is costing you. Not a report card — a plan.",
    accent: "ember",
  },
  {
    icon: Trophy,
    title: "Competitive Ranking",
    body: "All-India rank and percentile against every Nirvona candidate who sat the same paper, so your score has a reference point that means something.",
    accent: "saffron",
  },
  {
    icon: GraduationCap,
    title: "Personalized Insights",
    body: "Improvement trends across examinations, revision priorities ranked by marks at stake, and a clear read on whether your strategy is working.",
    accent: "success",
  },
  {
    icon: ScrollText,
    title: "Transparent Results",
    body: "Published answer keys, your full response sheet and question-level marking. Every mark you were awarded can be traced and verified.",
    accent: "royal",
  },
];

const ACCENTS = {
  navy: "bg-navy-50 text-navy-700 ring-navy-100 group-hover:bg-navy-900 group-hover:text-white",
  royal: "bg-royal-50 text-royal-600 ring-royal-100 group-hover:bg-royal-600 group-hover:text-white",
  ember: "bg-ember-50 text-ember-600 ring-ember-100 group-hover:bg-ember-600 group-hover:text-white",
  saffron: "bg-saffron-100 text-saffron-600 ring-saffron-200 group-hover:bg-saffron-500 group-hover:text-white",
  success: "bg-success-50 text-success-600 ring-success-100 group-hover:bg-success-600 group-hover:text-white",
} as const;

export function WhyNirvona() {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-nv">
        <SectionHeading
          eyebrow="Why Nirvona"
          title="Everything a serious aspirant needs, in one examination system"
          description="Most platforms give you questions. Nirvona gives you an examination, a rank, and a specific answer to the only question that matters: what should I fix next?"
        />

        <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map(({ icon: Icon, title, body, accent }) => (
            <StaggerItem key={title}>
              <article className="group h-full rounded-xl border border-ink-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lg">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl ring-1 ring-inset transition-colors duration-300",
                    ACCENTS[accent as keyof typeof ACCENTS],
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-navy-900">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-500">{body}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
