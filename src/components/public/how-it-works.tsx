"use client";

import { motion } from "framer-motion";
import {
  BarChart3, CreditCard, IdCard, MonitorCheck, Trophy, TrendingUp, UserPlus, Layers,
} from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

const STEPS = [
  { icon: UserPlus, title: "Register", body: "Create your Nirvona account in three short steps." },
  { icon: Layers, title: "Choose Program", body: "Pick Class 11, Class 12, Devoter, JEE or NEET." },
  { icon: CreditCard, title: "Purchase", body: "Select a package duration and complete payment." },
  { icon: IdCard, title: "Get Admit Card", body: "Download your admit card with exam-hall credentials." },
  { icon: MonitorCheck, title: "Take Exam", body: "Appear at your allotted centre for the CBT." },
  { icon: Trophy, title: "View Results", body: "Score, rank and percentile within 72 hours." },
  { icon: TrendingUp, title: "Improve", body: "Act on topic-level analytics before the next test." },
];

export function HowItWorks() {
  return (
    <section className="section-pad relative overflow-hidden bg-navy-950 text-white">
      <div aria-hidden className="absolute inset-0 grid-backdrop-dark opacity-60" />
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-royal-600/20 blur-[100px]"
      />

      <div className="container-nv relative">
        <SectionHeading
          onDark
          eyebrow="How it works"
          title="From sign-up to a smarter study plan"
          description="Seven steps, all of them visible to you in the student portal at every moment."
        />

        <ol className="mt-16 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-11 top-5 hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-white/25 to-transparent lg:block"
                />
              )}
              <div className="flex items-center gap-3">
                <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/8 ring-1 ring-inset ring-white/15 backdrop-blur">
                  <Icon className="size-5 text-saffron-300" aria-hidden />
                </span>
                <span className="font-display text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-white/40">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">{body}</p>
            </motion.li>
          ))}

          <motion.li
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="rounded-xl bg-gradient-to-br from-ember-600 to-ember-500 p-5 shadow-cta"
          >
            <BarChart3 className="size-5 text-white/80" aria-hidden />
            <p className="mt-4 font-display text-base font-semibold text-white">
              Then repeat — with data
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-white/85">
              Each cycle is measured against the last, so improvement is a number you can see, not a
              feeling.
            </p>
          </motion.li>
        </ol>
      </div>
    </section>
  );
}
