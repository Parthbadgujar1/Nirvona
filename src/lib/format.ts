/** Presentation-layer formatters. Keep every ₹ / date string in one place. */

export function formatCurrency(value: number, opts: { compact?: boolean } = {}) {
  if (opts.compact) {
    if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)}Cr`;
    if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)}L`;
    if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatDate(iso: string, style: "short" | "long" | "full" = "long") {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  if (style === "short") {
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
  }
  if (style === "full") {
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${formatDate(iso)} · ${date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function relativeTime(iso: string, now = new Date()) {
  const date = new Date(iso);
  const diff = date.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000000],
    ["month", 2592000000],
    ["day", 86400000],
    ["hour", 3600000],
    ["minute", 60000],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

export function daysUntil(iso: string, now = new Date()) {
  const date = new Date(iso);
  return Math.ceil((date.getTime() - now.getTime()) / 86400000);
}

export function percent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

export function maskSecret(value: string, visible = 2) {
  if (value.length <= visible) return "•".repeat(8);
  return `${value.slice(0, visible)}${"•".repeat(Math.max(6, value.length - visible))}`;
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
