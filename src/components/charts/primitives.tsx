"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Shared chart tokens so every visualisation reads as one system. */
export const CHART = {
  grid: "#e6e9f0",
  axis: "#98a1b3",
  navy: "#0e1d4a",
  royal: "#2563eb",
  ember: "#f95c14",
  saffron: "#f59e0b",
  success: "#10b981",
  danger: "#ef4444",
  muted: "#c6ccd8",
  series: ["#2563eb", "#f95c14", "#0e1d4a", "#10b981", "#f59e0b", "#7c3aed"],
};

export const axisProps = {
  stroke: CHART.axis,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelSuffix,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string }[];
  label?: string | number;
  formatter?: (value: number | string, name: string) => string;
  labelSuffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 shadow-lg">
      {label !== undefined && (
        <p className="mb-1.5 text-2xs font-bold uppercase tracking-wider text-ink-400">
          {label}
          {labelSuffix}
        </p>
      )}
      <ul className="space-y-1">
        {payload.map((entry, index) => (
          <li key={index} className="flex items-center gap-2 text-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span className="text-ink-500">{entry.name}</span>
            <span className="ml-auto font-semibold tabular text-navy-900">
              {formatter
                ? formatter(entry.value ?? 0, String(entry.name ?? ""))
                : String(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-ink-200 bg-white", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 p-5">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-navy-900">{title}</h3>
          {description && <p className="mt-1 text-xs text-ink-500">{description}</p>}
        </div>
        {action}
      </header>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function ChartLegend({
  items,
  className,
}: {
  items: { label: string; color: string; value?: string }[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-xs text-ink-600">
          <span
            className="size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          {item.label}
          {item.value && <span className="font-semibold tabular text-navy-900">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}
