import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";

const ASSURANCES = [
  "No hidden fees — the price you see is the price you pay",
  "Packages start the day you enrol",
  "Result, rank and analytics after every examination",
];

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-20 text-white lg:py-24">
      <div aria-hidden className="absolute inset-0 dot-backdrop opacity-[0.07]" />
      <div
        aria-hidden
        className="absolute -right-24 top-1/2 size-[30rem] -translate-y-1/2 rounded-full bg-ember-600/25 blur-[110px]"
      />
      <div
        aria-hidden
        className="absolute -left-24 top-0 size-[26rem] rounded-full bg-royal-600/20 blur-[110px]"
      />

      <div className="container-nv relative">
        <div className="mx-auto max-w-3xl text-center">
          <LogoMark size="xl" onDark className="mx-auto" />
          <h2 className="mt-8 font-display text-3xl font-bold leading-tight text-white sm:text-[2.75rem]">
            Start Your Nirvona Journey
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Register in under three minutes, choose the program that matches your goal, and sit your
            first computer-based examination with a real rank attached to it.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="xl">
              <Link href="/register">
                Create your account
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="onDark" size="xl">
              <Link href="/packages">Compare packages</Link>
            </Button>
          </div>

          <ul className="mt-10 flex flex-col items-center justify-center gap-x-8 gap-y-3 text-sm text-white/60 sm:flex-row sm:flex-wrap">
            {ASSURANCES.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-success-500" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
