"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

/**
 * Native select, styled. Keeps keyboard + screen-reader behaviour correct and
 * avoids a portal for the many filter bars in the admin portal.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-11 w-full appearance-none rounded-lg border bg-white pl-3.5 pr-9 text-sm text-navy-900 shadow-xs transition-colors",
          "focus:border-royal-500 focus:outline-none focus:ring-4 focus:ring-royal-500/12",
          "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400",
          invalid ? "border-danger-500" : "border-ink-200",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
        aria-hidden
      />
    </div>
  ),
);
Select.displayName = "Select";
