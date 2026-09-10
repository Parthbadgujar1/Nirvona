import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { Package } from "@/types";
import { cn } from "@/lib/utils";

export function PackageCard({
  pkg,
  className,
  courseName,
}: {
  pkg: Package;
  className?: string;
  courseName?: string;
}) {
  const recommended = pkg.recommended;
  const perTest = Math.round(pkg.price / pkg.tests);

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-2xl border bg-white transition-all duration-300",
        recommended
          ? "border-navy-900 shadow-xl lg:-my-3 lg:scale-[1.02]"
          : "border-ink-200 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lg",
        className,
      )}
    >
      {recommended && (
        <div className="flex items-center justify-center gap-1.5 rounded-t-2xl bg-brand-ember py-2 text-2xs font-bold uppercase tracking-[0.14em] text-white">
          <Sparkles className="size-3" aria-hidden />
          Most chosen
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {courseName && (
              <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                {courseName}
              </p>
            )}
            <h3 className="mt-1 font-display text-xl font-bold text-navy-900">
              {pkg.durationLabel}
            </h3>
          </div>
          {pkg.discountPercent ? (
            <Badge tone="success" size="sm">
              {pkg.discountPercent}% off
            </Badge>
          ) : null}
        </div>

        <p className="mt-2.5 text-sm leading-relaxed text-ink-500">{pkg.tagline}</p>

        <div className="mt-6 flex items-end gap-2.5">
          <span className="font-display text-[2.25rem] font-extrabold leading-none tabular text-navy-900">
            {formatCurrency(pkg.price)}
          </span>
          {pkg.originalPrice && (
            <span className="pb-1 text-sm font-medium tabular text-ink-400 line-through">
              {formatCurrency(pkg.originalPrice)}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-ink-500">
          {formatCurrency(perTest)} per examination · {pkg.durationMonths} months access
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-canvas p-4">
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-400">
              CBT exams
            </dt>
            <dd className="mt-0.5 font-display text-lg font-bold tabular text-navy-900">
              {pkg.tests}
            </dd>
          </div>
          <div>
            <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-400">
              Duration
            </dt>
            <dd className="mt-0.5 font-display text-lg font-bold tabular text-navy-900">
              {pkg.durationMonths}M
            </dd>
          </div>
        </dl>

        <ul className="mt-5 flex-1 space-y-2.5">
          {pkg.features.map((feature) => (
            <li key={feature} className="flex gap-2.5">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-700">
                <Check className="size-2.5" strokeWidth={3.5} aria-hidden />
              </span>
              <span className="text-sm leading-snug text-ink-600">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-2">
          <Button asChild variant={recommended ? "primary" : "navy"} size="lg" block>
            <Link href={`/checkout?package=${pkg.id}`}>
              Buy Now
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" block>
            <Link href={`/packages/${pkg.id}`}>View Details</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
