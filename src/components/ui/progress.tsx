"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  size = "md",
  label,
  tone = "navy",
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  size?: "xs" | "sm" | "md";
  label?: string;
  tone?: "navy" | "ember" | "success" | "warning" | "danger" | "royal";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const height = { xs: "h-1", sm: "h-1.5", md: "h-2.5" }[size];
  const tones = {
    navy: "bg-navy-800",
    royal: "bg-royal-600",
    ember: "bg-brand-ember",
    success: "bg-success-500",
    warning: "bg-warning-500",
    danger: "bg-danger-500",
  } as const;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("w-full overflow-hidden rounded-full bg-ink-100", height, className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", tones[tone], barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Steps({
  steps,
  current,
  className,
}: {
  steps: { label: string; description?: string }[];
  current: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex w-full items-center", className)}>
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "active" : "upcoming";
        return (
          <li
            key={step.label}
            className={cn("flex items-center", index < steps.length - 1 && "flex-1")}
            aria-current={state === "active" ? "step" : undefined}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  state === "done" && "bg-success-500 text-white",
                  state === "active" && "bg-navy-900 text-white ring-4 ring-navy-900/12",
                  state === "upcoming" && "bg-ink-100 text-ink-400 ring-1 ring-inset ring-ink-200",
                )}
              >
                {state === "done" ? (
                  <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
                    <path d="m5 10 3.5 3.5L15 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span className="hidden sm:block">
                <span
                  className={cn(
                    "block text-sm font-semibold",
                    state === "upcoming" ? "text-ink-400" : "text-navy-900",
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="block text-xs text-ink-500">{step.description}</span>
                )}
              </span>
            </div>
            {index < steps.length - 1 && (
              <span
                className={cn(
                  "mx-3 h-0.5 flex-1 rounded-full transition-colors sm:mx-4",
                  index < current ? "bg-success-500" : "bg-ink-200",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
