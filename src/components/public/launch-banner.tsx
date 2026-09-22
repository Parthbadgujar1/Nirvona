"use client";

import * as React from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Temporary launch announcement for the Oct 2026 CBT batch in
 * Chhatrapati Sambhajinagar (client-requested, offline launch offer).
 * Remove this component + its import in SiteLayout once the offer ends.
 */
const REGISTER_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSf44zr6TE1m9KBMLOIDuetWuTRU9w8PHni92S0uMh0AgvREYw/viewform";
const DISMISS_KEY = "nirvona.launch-banner-2026-10.dismissed";

export function LaunchBanner() {
  const [dismissed, setDismissed] = React.useState(true);

  React.useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (dismissed) return null;

  return (
    <div className="relative bg-navy-950 text-white">
      <div className="container-nv flex flex-col items-center gap-2 py-2.5 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ember-600/20 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-ember-400">
          <Sparkles className="size-3.5" aria-hidden />
          New batch — Oct launch
        </span>
        <p className="text-sm font-medium leading-snug">
          Nirvona's 1st CBT Program launches this October in Chhatrapati Sambhajinagar —{" "}
          <span className="font-bold text-saffron-300">3 Practice Tests for ₹1,999</span>. Limited seats.
        </p>
        <a
          href={REGISTER_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-navy-950",
            "transition-colors hover:bg-saffron-200",
          )}
        >
          Register now
          <ArrowRight className="size-3.5" aria-hidden />
        </a>
        <a href="tel:+917709766717" className="text-xs font-semibold text-white/70 hover:text-white">
          +91 77097 66717
        </a>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
