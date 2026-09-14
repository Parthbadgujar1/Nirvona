"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 active:translate-y-px",
  {
    variants: {
      variant: {
        /* Level 4 — primary conversion action */
        primary:
          "bg-brand-ember text-white shadow-cta hover:brightness-[1.06] hover:shadow-[0_10px_26px_-6px_rgb(234_65_8/0.5)]",
        /* Level 4 — primary navigation action */
        navy: "bg-navy-900 text-white shadow-md hover:bg-navy-800",
        /* Level 3 — interactive */
        secondary:
          "bg-white text-navy-900 ring-1 ring-inset ring-ink-200 shadow-xs hover:bg-ink-50 hover:ring-ink-300",
        outline:
          "bg-transparent text-navy-800 ring-1 ring-inset ring-navy-200 hover:bg-navy-50 hover:ring-navy-300",
        ghost: "bg-transparent text-ink-600 hover:bg-ink-100 hover:text-navy-900",
        subtle: "bg-navy-50 text-navy-800 hover:bg-navy-100",
        danger: "bg-danger-600 text-white shadow-sm hover:bg-danger-700",
        success: "bg-success-600 text-white shadow-sm hover:bg-success-700",
        link: "bg-transparent text-royal-700 underline-offset-4 hover:underline p-0 h-auto",
        onDark:
          "bg-white/10 text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm hover:bg-white/20",
      },
      size: {
        xs: "h-8 rounded-md px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-9 rounded-md px-3.5 text-sm [&_svg]:size-4",
        md: "h-10 rounded-lg px-4 text-sm [&_svg]:size-4",
        lg: "h-12 rounded-lg px-6 text-[0.95rem] [&_svg]:size-[18px]",
        xl: "h-14 rounded-xl px-8 text-base [&_svg]:size-5",
        icon: "size-10 rounded-lg [&_svg]:size-[18px]",
        "icon-sm": "size-8 rounded-md [&_svg]:size-4",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
