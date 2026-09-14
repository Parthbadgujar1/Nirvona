"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer size-[18px] shrink-0 rounded border border-ink-300 bg-white shadow-xs transition-colors",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600",
      "data-[state=checked]:border-navy-900 data-[state=checked]:bg-navy-900 data-[state=checked]:text-white",
      "data-[state=indeterminate]:border-navy-900 data-[state=indeterminate]:bg-navy-900 data-[state=indeterminate]:text-white",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      {props.checked === "indeterminate" ? (
        <Minus className="size-3.5" strokeWidth={3} />
      ) : (
        <Check className="size-3.5" strokeWidth={3} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";

export const Switch = React.forwardRef<
  HTMLButtonElement,
  { checked: boolean; onCheckedChange: (v: boolean) => void; id?: string; disabled?: boolean; label?: string }
>(({ checked, onCheckedChange, id, disabled, label }, ref) => (
  <button
    ref={ref}
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
      checked ? "bg-navy-900" : "bg-ink-300",
    )}
  >
    <span
      className={cn(
        "inline-block size-5 rounded-full bg-white shadow-sm transition-transform",
        checked ? "translate-x-[22px]" : "translate-x-0.5",
      )}
    />
  </button>
));
Switch.displayName = "Switch";
