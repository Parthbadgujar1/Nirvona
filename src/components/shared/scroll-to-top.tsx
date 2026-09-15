import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Next.js's App Router scrolled to the top of the page on every
 * navigation by default; React Router does not - without this, every
 * internal link preserves whatever scroll position the previous page
 * was at, which reads as broken (e.g. clicking "View Details" from
 * partway down the packages grid lands on the detail page already
 * scrolled halfway down).
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
