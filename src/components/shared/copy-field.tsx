"use client";

import * as React from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Renders a credential value. Secrets are masked by default and must be
 * explicitly revealed — these are exam-hall credentials, never portal logins.
 */
export function CopyField({
  label,
  value,
  secret = false,
  className,
  tone = "light",
}: {
  label: string;
  value: string;
  secret?: boolean;
  className?: string;
  tone?: "light" | "dark";
}) {
  const [revealed, setRevealed] = React.useState(!secret);
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  const shown = revealed ? value : "•".repeat(Math.max(8, value.length));

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        tone === "dark" ? "border-white/15 bg-white/5" : "border-ink-200 bg-white",
        className,
      )}
    >
      <p
        className={cn(
          "text-2xs font-bold uppercase tracking-wider",
          tone === "dark" ? "text-white/60" : "text-ink-500",
        )}
      >
        {label}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <code
          className={cn(
            "flex-1 truncate font-mono text-sm font-semibold tracking-tight",
            tone === "dark" ? "text-white" : "text-navy-900",
          )}
        >
          {shown}
        </code>
        {secret && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? `Hide ${label}` : `Reveal ${label}`}
            className={cn(
              "rounded p-1 transition-colors",
              tone === "dark" ? "text-white/60 hover:text-white" : "text-ink-400 hover:text-navy-900",
            )}
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className={cn(
            "rounded p-1 transition-colors",
            tone === "dark" ? "text-white/60 hover:text-white" : "text-ink-400 hover:text-navy-900",
          )}
        >
          {copied ? <Check className="size-4 text-success-500" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}
