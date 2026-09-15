"use client";

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Sets document.title (and, optionally, the meta description) for the
 * current page - replaces Next.js's per-route `export const metadata`
 * (a build-time/server feature with no equivalent in a client-rendered
 * SPA). The title suffix mirrors the three title templates the App
 * Router layouts used to apply (root/admin/student), picked from the
 * current path so call sites don't need to say which section they're
 * in - same inheritance the old layout.tsx files gave for free.
 */
export function usePageTitle(title: string, description?: string): void {
  const location = useLocation();

  useEffect(() => {
    const suffix = location.pathname.startsWith("/admin")
      ? "Nirvona Admin"
      : location.pathname.startsWith("/student")
        ? "Nirvona Student Portal"
        : "Nirvona Education Tech";

    document.title = `${title} · ${suffix}`;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
  }, [title, description, location.pathname]);
}
