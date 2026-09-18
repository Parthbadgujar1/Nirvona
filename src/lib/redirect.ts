/**
 * Resolve a `?next=` style post-login destination.
 *
 * Only same-site absolute paths are honoured ("/checkout?package=1") -
 * anything else (a full URL, a protocol-relative "//evil.com", a
 * backslash trick) falls back, so a crafted login link can't bounce a
 * freshly-authenticated user to another site.
 */
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

/** Login URL that returns the user to `path` (current location by default) after signing in. */
export function loginUrl(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`;
}
