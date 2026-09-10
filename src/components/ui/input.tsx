"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, leading, trailing, ...props }, ref) => {
    const field = (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-navy-900 shadow-xs transition-colors",
          "placeholder:text-ink-400",
          "focus:border-royal-500 focus:outline-none focus:ring-4 focus:ring-royal-500/12",
          "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400",
          invalid ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/12" : "border-ink-200",
          leading && "pl-10",
          trailing && "pr-10",
          className,
        )}
        {...props}
      />
    );

    if (!leading && !trailing) return field;
    return (
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 [&_svg]:size-4">
            {leading}
          </span>
        )}
        {field}
        {trailing && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 [&_svg]:size-4">
            {trailing}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-navy-900 shadow-xs transition-colors",
      "placeholder:text-ink-400 focus:border-royal-500 focus:outline-none focus:ring-4 focus:ring-royal-500/12",
      invalid ? "border-danger-500" : "border-ink-200",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  className,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-ink-700", className)}
      {...props}
    >
      {props.children}
      {required && <span className="ml-0.5 text-ember-600">*</span>}
    </label>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-danger-600">
      {children}
    </p>
  );
}

export function Hint({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs text-ink-500">{children}</p>;
}

export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      <FieldError>{error}</FieldError>
      {!error && <Hint>{hint}</Hint>}
    </div>
  );
}
