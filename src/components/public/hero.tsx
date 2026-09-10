"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";
import { ExamConsole } from "./exam-console";

const HIGHLIGHTS = [
  { value: "12,800+", label: "Students enrolled" },
  { value: "48", label: "CBT examinations run" },
  { value: "6", label: "Examination centres" },
  { value: "99.2%", label: "On-time result delivery" },
];

const fade = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      {/* Layered backdrop */}
      <div aria-hidden className="absolute inset-0 grid-backdrop-dark mask-fade-b opacity-70" />
      <div
        aria-hidden
        className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-royal-600/25 blur-[120px]"
      />
      <div
        aria-hidden
        className="absolute -bottom-52 right-0 size-[38rem] rounded-full bg-ember-600/20 blur-[130px]"
      />

      <div className="container-nv relative pb-20 pt-16 lg:pb-28 lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
          >
            <motion.div variants={fade} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <span className="inline-flex items-center gap-2.5 rounded-full bg-white/8 py-1.5 pl-1.5 pr-4 text-xs font-medium text-white/80 ring-1 ring-inset ring-white/15">
                <LogoMark size="xs" onDark />
                Nirvona Education Tech
                <span className="hidden h-3 w-px bg-white/20 sm:block" />
                <span className="hidden text-saffron-300 sm:inline">CBT-04 opens 15 Sep</span>
              </span>
            </motion.div>

            <motion.h1
              variants={fade}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[3.65rem]"
            >
              Prepare. Test.
              <br />
              <span className="text-brand-ember">Analyze. Improve.</span>
            </motion.h1>

            <motion.p
              variants={fade}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg"
            >
              India&apos;s next-generation examination and performance platform for ambitious
              students. Sit real computer-based tests at our centres, get an all-India rank, and
              receive analytics precise enough to plan your next week of study.
            </motion.p>

            <motion.div
              variants={fade}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Button asChild size="xl">
                <Link href="/courses">
                  Explore Programs
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="onDark" size="xl">
                <Link href="/cbt">
                  <MonitorPlay />
                  Learn About CBT
                </Link>
              </Button>
            </motion.div>

            <motion.dl
              variants={fade}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-4"
            >
              {HIGHLIGHTS.map((item) => (
                <div key={item.label}>
                  <dt className="font-display text-2xl font-bold tabular text-white">
                    {item.value}
                  </dt>
                  <dd className="mt-1 text-xs leading-snug text-white/55">{item.label}</dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          <div className="relative lg:pl-6">
            <ExamConsole />
          </div>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white/[0.03]" />
      <div className="relative">
        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-ember-500/50 to-transparent" />
      </div>
    </section>
  );
}
