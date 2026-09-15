import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/use-page-title";

/**
 * Replaces Next.js's automatic 404 page (and every in-page `notFound()`
 * call, which threw to the nearest not-found boundary) - React Router
 * has no built-in equivalent, so this is used both as the catch-all
 * "*" route and via <Navigate to="/404" /> wherever a page used to call
 * notFound() for a missing record (an unknown course/package id, etc).
 */
export default function NotFoundPage() {
  usePageTitle("Page not found");
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="font-display text-6xl font-extrabold text-navy-900">404</p>
      <h1 className="font-display text-xl font-semibold text-navy-900">Page not found</h1>
      <p className="max-w-md text-sm text-ink-500">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Button asChild size="lg">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}
