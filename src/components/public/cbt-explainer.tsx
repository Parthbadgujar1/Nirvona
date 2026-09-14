import Link from "next/link";
import { ArrowRight, Check, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";

const POINTS = [
  "You sit at an allotted computer at a Nirvona examination centre",
  "Questions, timer and the question palette appear exactly as in national exams",
  "You can mark questions for review, switch sections and change answers freely",
  "The paper submits automatically the moment the timer reaches zero",
  "Your responses are captured digitally — nothing is lost to handwriting or OMR errors",
];

export function CbtExplainer() {
  return (
    <section className="section-pad bg-white">
      <div className="container-nv">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Computer-based testing"
              title="What exactly is a CBT examination?"
              description="A Computer-Based Test replaces the paper and OMR sheet with a screen. You answer on a computer at a supervised examination centre, and your responses are recorded and evaluated digitally."
            />
            <ul className="mt-8 space-y-3.5">
              {POINTS.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-700">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="text-sm leading-relaxed text-ink-600">{point}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="navy" size="lg" className="mt-9">
              <Link href="/cbt">
                Read the full CBT guide
                <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-ink-200 bg-ink-50 shadow-lg">
              <div className="flex items-center justify-between border-b border-ink-200 bg-white px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-navy-900">
                  <Monitor className="size-4 text-royal-600" aria-hidden />
                  Nirvona CBT · CBT-04
                </div>
                <span className="rounded-md bg-danger-50 px-2 py-1 font-mono text-xs font-bold tabular text-danger-600">
                  01:47:22
                </span>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-[1.6fr_1fr]">
                <div className="rounded-xl border border-ink-200 bg-white p-4">
                  <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                    Question 24 · Physics · +4 / −1
                  </p>
                  <p className="mt-2.5 text-sm leading-relaxed text-navy-900">
                    A particle moves along a straight line such that its displacement varies as
                    <span className="mx-1 font-mono text-royal-700">s = 3t³ − 2t² + 5t</span>. Find
                    its acceleration at <span className="font-mono text-royal-700">t = 2 s</span>.
                  </p>
                  <ul className="mt-4 space-y-2">
                    {["28 m/s²", "32 m/s²", "36 m/s²", "40 m/s²"].map((option, index) => (
                      <li
                        key={option}
                        className={
                          index === 1
                            ? "flex items-center gap-3 rounded-lg border border-royal-300 bg-royal-50 px-3 py-2 text-sm font-medium text-navy-900"
                            : "flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-600"
                        }
                      >
                        <span
                          className={
                            index === 1
                              ? "flex size-5 items-center justify-center rounded-full bg-royal-600 text-2xs font-bold text-white"
                              : "flex size-5 items-center justify-center rounded-full bg-ink-100 text-2xs font-bold text-ink-500"
                          }
                        >
                          {String.fromCharCode(65 + index)}
                        </span>
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-ink-200 bg-white p-4">
                  <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                    Question palette
                  </p>
                  <div className="mt-3 grid grid-cols-5 gap-1.5">
                    {Array.from({ length: 30 }).map((_, index) => {
                      const state =
                        index === 23 ? "current" : index < 20 ? (index % 5 === 0 ? "review" : "answered") : "unseen";
                      const classes = {
                        current: "bg-royal-600 text-white ring-2 ring-royal-300",
                        answered: "bg-success-500 text-white",
                        review: "bg-saffron-400 text-navy-900",
                        unseen: "bg-ink-100 text-ink-400",
                      }[state];
                      return (
                        <span
                          key={index}
                          className={`flex size-7 items-center justify-center rounded-md text-2xs font-bold tabular ${classes}`}
                        >
                          {index + 1}
                        </span>
                      );
                    })}
                  </div>
                  <ul className="mt-4 space-y-1.5 text-2xs text-ink-500">
                    <li className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm bg-success-500" /> Answered
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm bg-saffron-400" /> Marked for review
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm bg-ink-200" /> Not visited
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-ink-400">
              Illustrative interface — the live examination runs at the centre.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
