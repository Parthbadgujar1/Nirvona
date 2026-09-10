"use client";

import { motion } from "framer-motion";
import { Award, CheckCircle2, Clock, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  { name: "Physics", value: 82, color: "#2563eb" },
  { name: "Chemistry", value: 92, color: "#f95c14" },
  { name: "Mathematics", value: 66, color: "#0e1d4a" },
];

const TREND = [42, 51, 48, 58, 63, 61, 72, 79];

/**
 * Abstract product visual for the hero: a stylised result console assembled
 * from real interface parts rather than a stock photograph.
 */
export function ExamConsole({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      {/* Ambient gradient wash */}
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-[3rem] bg-[radial-gradient(60%_60%_at_70%_20%,rgba(37,99,235,0.20),transparent_70%),radial-gradient(50%_50%_at_20%_80%,rgba(249,92,20,0.18),transparent_70%)] blur-2xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 28, rotateX: 6 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="relative rounded-2xl border border-white/10 bg-navy-950/95 p-4 shadow-[0_40px_80px_-30px_rgba(8,18,49,0.65)] backdrop-blur sm:p-5"
      >
        {/* Window chrome */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-ember-500/80" />
            <span className="size-2.5 rounded-full bg-saffron-400/80" />
            <span className="size-2.5 rounded-full bg-success-500/70" />
          </div>
          <span className="rounded-full bg-white/8 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-white/60 ring-1 ring-inset ring-white/10">
            CBT-03 · Result
          </span>
        </div>

        {/* Score hero */}
        <div className="grid gap-3 sm:grid-cols-[1.1fr_1fr]">
          <div className="rounded-xl bg-gradient-to-br from-navy-800 to-navy-900 p-4 ring-1 ring-inset ring-white/10">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-white/50">
              Total Score
            </p>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-bold tabular text-white">287</span>
              <span className="text-sm font-medium text-white/45">/ 360</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/12">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "79.7%" }}
                transition={{ duration: 1.2, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-brand-ember"
              />
            </div>
            <p className="mt-2 text-[0.6875rem] font-medium text-saffron-300">
              79.72% · +12% vs CBT-02
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniStat icon={Award} label="Rank" value="#127" tone="saffron" />
            <MiniStat icon={TrendingUp} label="Percentile" value="96.8" tone="royal" />
            <MiniStat icon={Target} label="Accuracy" value="89.2%" tone="success" />
            <MiniStat icon={Clock} label="Time" value="180m" tone="white" />
          </div>
        </div>

        {/* Subject bars */}
        <div className="mt-3 rounded-xl bg-white/[0.04] p-4 ring-1 ring-inset ring-white/10">
          <div className="flex items-center justify-between">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-white/50">
              Subject performance
            </p>
            <span className="text-[0.625rem] font-medium text-white/40">vs cohort average</span>
          </div>
          <div className="mt-3 space-y-3">
            {SUBJECTS.map((subject, index) => (
              <div key={subject.name}>
                <div className="mb-1.5 flex items-center justify-between text-[0.6875rem]">
                  <span className="font-medium text-white/75">{subject.name}</span>
                  <span className="font-semibold tabular text-white">{subject.value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.value}%` }}
                    transition={{
                      duration: 1,
                      delay: 0.85 + index * 0.12,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trend sparkline */}
        <div className="mt-3 flex items-end gap-1.5 rounded-xl bg-white/[0.04] p-4 ring-1 ring-inset ring-white/10">
          {TREND.map((value, index) => (
            <motion.span
              key={index}
              initial={{ height: 4, opacity: 0 }}
              animate={{ height: value * 0.62, opacity: 1 }}
              transition={{ duration: 0.7, delay: 1 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "flex-1 rounded-t-sm",
                index === TREND.length - 1 ? "bg-brand-ember" : "bg-royal-500/45",
              )}
            />
          ))}
        </div>
      </motion.div>

      {/* Floating cards */}
      <motion.div
        initial={{ opacity: 0, x: -24, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -left-4 bottom-16 hidden w-52 rounded-xl border border-ink-200 bg-white p-3.5 shadow-xl sm:block"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-success-50 text-success-600">
            <CheckCircle2 className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold text-navy-900">Admit card ready</p>
            <p className="text-[0.625rem] text-ink-500">CBT-04 · 15 Sep 2026</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 24, y: -10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -right-5 top-20 hidden w-48 rounded-xl border border-ink-200 bg-white p-3.5 shadow-xl lg:block"
      >
        <p className="text-[0.625rem] font-bold uppercase tracking-wider text-ink-400">
          Weakest topic
        </p>
        <p className="mt-1 text-sm font-semibold text-navy-900">Calculus</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full w-[52%] rounded-full bg-danger-500" />
        </div>
        <p className="mt-1.5 text-[0.625rem] text-ink-500">52% accuracy · 14 marks lost</p>
      </motion.div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Award;
  label: string;
  value: string;
  tone: "saffron" | "royal" | "success" | "white";
}) {
  const tones = {
    saffron: "text-saffron-300",
    royal: "text-royal-300",
    success: "text-success-500",
    white: "text-white/70",
  };
  return (
    <div className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-inset ring-white/10">
      <Icon className={cn("size-3.5", tones[tone])} aria-hidden />
      <p className="mt-1.5 text-[0.625rem] font-medium uppercase tracking-wider text-white/45">
        {label}
      </p>
      <p className="font-display text-base font-bold tabular text-white">{value}</p>
    </div>
  );
}
