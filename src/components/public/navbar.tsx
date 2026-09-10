"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, LayoutDashboard, Menu, ShieldCheck, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { COURSES } from "@/data/courses";
import { publicNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [programsOpen, setProgramsOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    // Deferred so a page restored mid-scroll still gets the condensed header,
    // without writing state during the effect body.
    const frame = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  function openPrograms() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setProgramsOpen(true);
  }
  function scheduleProgramsClose() {
    closeTimer.current = setTimeout(() => setProgramsOpen(false), 140);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-ink-200/80 bg-white/85 backdrop-blur-xl"
          : "border-b border-transparent bg-white/0",
      )}
    >
      <div className="container-nv">
        <div className="flex h-[4.5rem] items-center justify-between gap-4">
          <Logo size="md" />

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {publicNav.map((item) =>
              item.href === "/courses" ? (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={openPrograms}
                  onMouseLeave={scheduleProgramsClose}
                >
                  <Link
                    href="/courses"
                    aria-expanded={programsOpen}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "text-navy-900"
                        : "text-ink-600 hover:bg-ink-100/70 hover:text-navy-900",
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform duration-200",
                        programsOpen && "rotate-180",
                      )}
                    />
                  </Link>
                  <AnimatePresence>
                    {programsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-1/2 top-full w-[26rem] -translate-x-1/2 pt-3"
                      >
                        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white p-2 shadow-xl">
                          {COURSES.map((course) => (
                            <Link
                              key={course.slug}
                              href={`/courses/${course.slug}`}
                              className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-ink-50"
                            >
                              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 font-display text-xs font-bold text-navy-800">
                                {course.shortName.replace("Class ", "C")}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-navy-900">
                                  {course.name}
                                </span>
                                <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                                  {course.tagline}
                                </span>
                              </span>
                            </Link>
                          ))}
                          <Link
                            href="/packages"
                            className="mt-1 flex items-center justify-between rounded-xl bg-navy-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
                          >
                            Compare all packages
                            <span aria-hidden>→</span>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "text-navy-900"
                      : "text-ink-600 hover:bg-ink-100/70 hover:text-navy-900",
                  )}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button asChild variant="ghost" size="md">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="md">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="inline-flex size-10 items-center justify-center rounded-lg text-navy-900 transition-colors hover:bg-ink-100 lg:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-ink-200 bg-white lg:hidden"
          >
            <nav
              aria-label="Mobile"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a")) setMobileOpen(false);
              }}
              className="container-nv max-h-[calc(100dvh-4.5rem)] overflow-y-auto py-4"
            >
              <ul className="space-y-1">
                {publicNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block rounded-lg px-3 py-2.5 text-[0.95rem] font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-navy-50 text-navy-900"
                          : "text-ink-600 hover:bg-ink-50",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-5 px-3 text-2xs font-bold uppercase tracking-wider text-ink-400">
                Programs
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {COURSES.map((course) => (
                  <li key={course.slug}>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="block rounded-lg border border-ink-200 px-3 py-2.5 text-sm font-semibold text-navy-900"
                    >
                      {course.shortName}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-5 grid gap-2 border-t border-ink-100 pt-5">
                <Button asChild size="lg" block>
                  <Link href="/register">Get Started</Link>
                </Button>
                <Button asChild variant="secondary" size="lg" block>
                  <Link href="/login">Login</Link>
                </Button>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/student/dashboard">
                      <LayoutDashboard />
                      Student demo
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/admin/dashboard">
                      <ShieldCheck />
                      Admin demo
                    </Link>
                  </Button>
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
