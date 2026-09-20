/**
 * Idle-time prefetching of page code.
 *
 * Every page is its own lazily-loaded chunk (so the first visit downloads
 * only what it needs). The cost of that is a brief pause the first time
 * someone opens each page. Once the browser is idle we quietly download the
 * pages they are likely to open next, so most clicks find the code already
 * cached and the page appears instantly.
 *
 * Politeness rules: nothing is fetched on a data-saver or 2G connection,
 * requests are spaced out (never a burst that competes with the page the
 * user is actually looking at), and only the section that is relevant is
 * fetched (a public visitor never downloads the admin portal).
 */

type Loader = () => Promise<unknown>;

// Vite turns each glob entry into a dynamic import of that page's chunk -
// the very same chunk React.lazy() in App.tsx requests, so this simply warms it.
const sections: Record<"public" | "student" | "admin", Record<string, Loader>> = {
  public: import.meta.glob(["../pages/site/*.tsx", "../pages/auth/*.tsx", "../pages/flow/*.tsx"]) as Record<string, Loader>,
  student: import.meta.glob(["../pages/student/*.tsx", "../layouts/StudentLayout.tsx"]) as Record<string, Loader>,
  admin: import.meta.glob(["../pages/admin/*.tsx", "../layouts/AdminLayout.tsx"]) as Record<string, Loader>,
};

const done = new Set<string>();
let queue: Loader[] = [];
let running = false;

function connectionAllowsPrefetch(): boolean {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (!c) return true;
  return !c.saveData && !/(^|-)2g$/.test(c.effectiveType ?? "");
}

const whenIdle = (fn: () => void) =>
  "requestIdleCallback" in window
    ? (window as Window & { requestIdleCallback: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback(fn, { timeout: 3000 })
    : setTimeout(fn, 800);

function pump() {
  if (running) return;
  running = true;
  const next = () => {
    const loader = queue.shift();
    if (!loader) {
      running = false;
      return;
    }
    loader().catch(() => {}).finally(() => setTimeout(() => whenIdle(next), 120));
  };
  whenIdle(next);
}

function enqueue(section: keyof typeof sections) {
  for (const [path, loader] of Object.entries(sections[section])) {
    if (done.has(path)) continue;
    done.add(path);
    queue.push(loader);
  }
}

/** Which portal the stored session belongs to (a returning signed-in user). */
function storedRole(): "student" | "admin" | null {
  try {
    const raw = window.localStorage.getItem("nirvona.session");
    const role = raw ? (JSON.parse(raw) as { role?: string }).role : null;
    return role === "admin" || role === "student" ? role : null;
  } catch {
    return null;
  }
}

/** Call on every navigation; safe to call repeatedly (each page is fetched once). */
export function prefetchLikelyPages(pathname: string): void {
  if (typeof window === "undefined" || !connectionAllowsPrefetch()) return;

  // The portal being viewed comes first; then the public pages; then the
  // signed-in user's own portal. Someone who is not signed in never
  // downloads a portal's code.
  const role = storedRole();
  const wanted = new Set<keyof typeof sections>();
  if (pathname.startsWith("/admin") && role === "admin") wanted.add("admin");
  if (pathname.startsWith("/student") && role === "student") wanted.add("student");
  wanted.add("public");
  if (role) wanted.add(role);

  wanted.forEach(enqueue);
  if (!queue.length) return;

  // Never during the page's own load: wait until it has finished, then a
  // further couple of seconds, so prefetching can't slow the first paint.
  const start = () => setTimeout(pump, 2500);
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
