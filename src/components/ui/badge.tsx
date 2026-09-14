import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      tone: {
        navy: "bg-navy-50 text-navy-800 ring-1 ring-inset ring-navy-100",
        royal: "bg-royal-50 text-royal-700 ring-1 ring-inset ring-royal-100",
        ember: "bg-ember-50 text-ember-700 ring-1 ring-inset ring-ember-100",
        saffron: "bg-saffron-100 text-saffron-600 ring-1 ring-inset ring-saffron-200",
        success: "bg-success-50 text-success-700 ring-1 ring-inset ring-success-100",
        warning: "bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-100",
        danger: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-100",
        neutral: "bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200",
        solid: "bg-navy-900 text-white",
        onDark: "bg-white/12 text-white ring-1 ring-inset ring-white/20",
      },
      size: {
        sm: "px-2 py-0.5 text-2xs",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export function Badge({
  className,
  tone,
  size,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}
