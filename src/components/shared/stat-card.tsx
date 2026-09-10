"use client";

import Link from "next/link";
import { ArrowRight, ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Counter } from "./counter";
import { cn } from "@/lib/utils";

const ACCENTS = {
  navy: "bg-navy-50 text-navy-700 ring-navy-100",
  royal: "bg-royal-50 text-royal-600 ring-royal-100",
  ember: "bg-ember-50 text-ember-600 ring-ember-100",
  success: "bg-success-50 text-success-600 ring-success-100",
  saffron: "bg-saffron-100 text-saffron-600 ring-saffron-200",
  danger: "bg-danger-50 text-danger-600 ring-danger-100",
} as const;

export function StatCard({
  label,
  value,
  numericValue,
  decimals = 0,
  prefix,
  suffix,
  icon: Icon,
  accent = "navy",
  delta,
  hint,
  href,
  className,
}: {
  label: string;
  value?: string;
  numericValue?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  icon?: LucideIcon;
  accent?: keyof typeof ACCENTS;
  delta?: number;
  hint?: string;
  href?: string;
  className?: string;
}) {
  const body = (
    <Card
      interactive={Boolean(href)}
      className={cn("group relative overflow-hidden p-5", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</p>
        {Icon && (
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-lg ring-1 ring-inset",
              ACCENTS[accent],
            )}
          >
            <Icon className="size-[18px]" aria-hidden />
          </span>
        )}
      </div>

      <p className="mt-3 font-display text-[1.75rem] font-bold leading-none text-navy-900">
        {numericValue !== undefined ? (
          <Counter value={numericValue} decimals={decimals} prefix={prefix} suffix={suffix} />
        ) : (
          value
        )}
      </p>

      <div className="mt-3 flex items-center gap-2 text-xs">
        {delta !== undefined && delta !== 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
              delta > 0 ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700",
            )}
          >
            {delta > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="truncate text-ink-500">{hint}</span>}
      </div>

      {href && (
        <ArrowRight className="absolute bottom-5 right-5 size-4 text-ink-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-ember-600" />
      )}
    </Card>
  );

  return href ? (
    <Link href={href} className="block rounded-xl">
      {body}
    </Link>
  ) : (
    body
  );
}
