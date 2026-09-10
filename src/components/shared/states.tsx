"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertOctagon, RefreshCcw, type LucideIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ------------------------------ Empty state -------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  branded = false,
  className,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  secondaryAction?: { label: string; href?: string; onClick?: () => void };
  branded?: boolean;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-white/60 text-center",
        compact ? "px-6 py-10" : "px-6 py-16",
        className,
      )}
    >
      <div className="relative mb-5">
        <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-navy-100/60" />
        {branded ? (
          <span className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-ink-200">
            <LogoMark size="lg" />
          </span>
        ) : (
          <span className="flex size-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-600 ring-1 ring-navy-100">
            {Icon ? <Icon className="size-6" aria-hidden /> : <LogoMark size="md" />}
          </span>
        )}
      </div>
      <h3 className="font-display text-base font-semibold text-navy-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action &&
            (action.href ? (
              <Button asChild size="sm">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button size="sm" onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
          {secondaryAction &&
            (secondaryAction.href ? (
              <Button asChild variant="secondary" size="sm">
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Error state -------------------------- */

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this section. Please try again — if it keeps happening, contact support.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-danger-500/25 bg-danger-50/50 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-danger-100 text-danger-600">
        <AlertOctagon className="size-6" aria-hidden />
      </span>
      <h3 className="font-display text-base font-semibold text-navy-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-600">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-6" onClick={onRetry}>
          <RefreshCcw />
          Try again
        </Button>
      )}
    </div>
  );
}

/* ----------------------------- Loading states ------------------------ */

export function LoadingState({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-16", className)} role="status">
      <span className="relative flex size-12 items-center justify-center">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-navy-200/70" />
        <LogoMark size="md" />
      </span>
      <p className="text-sm font-medium text-ink-500">{label}…</p>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-3 h-3 w-20" />
    </Card>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
      <div className="border-b border-ink-100 bg-ink-50/70 px-4 py-3">
        <Skeleton className="h-3.5 w-40" />
      </div>
      <div className="divide-y divide-ink-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-4">
            {Array.from({ length: columns }).map((__, c) => (
              <Skeleton key={c} className={cn("h-3.5", c === 0 ? "w-40" : "w-24")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-6", className)}>
      <Skeleton className="h-4 w-32" />
      <SkeletonText className="mt-4" lines={3} />
    </Card>
  );
}

/* ------------------------- Entrance animation ------------------------ */

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  once = true,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: delay } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
