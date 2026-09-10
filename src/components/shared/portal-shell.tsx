"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, Settings, User, X,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger,
} from "@/components/ui/dropdown";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useSession } from "@/hooks/use-session";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { NavItem } from "@/lib/nav";
import { groupBy, cn } from "@/lib/utils";

export interface PortalShellProps {
  nav: NavItem[];
  role: "student" | "admin";
  children: React.ReactNode;
  /** Items shown in the mobile bottom bar (max 4; a "More" button fills the 5th slot). */
  mobileNav?: NavItem[];
  notificationsHref: string;
  unreadCount?: number;
  profileHref: string;
}

export function PortalShell({
  nav,
  role,
  children,
  mobileNav,
  notificationsHref,
  unreadCount = 0,
  profileHref,
}: PortalShellProps) {
  const pathname = usePathname();
  const { session, signOut } = useSession(role);
  const { value: collapsed, setValue: setCollapsed } = useLocalStorage(
    `nirvona.${role}.sidebar`,
    false,
  );
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const groups = React.useMemo(() => groupBy(nav, (item) => item.group ?? "General"), [nav]);
  const bottomNav = (mobileNav ?? nav.slice(0, 4)).slice(0, 4);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const sidebarBody = (dense: boolean) => (
    <nav aria-label="Portal" className="flex-1 space-y-6 overflow-y-auto nv-scroll px-3 py-5">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          {!dense && (
            <p className="px-3 pb-2 text-2xs font-bold uppercase tracking-[0.14em] text-white/35">
              {group}
            </p>
          )}
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={dense ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-white/12 text-white"
                        : "text-white/60 hover:bg-white/[0.07] hover:text-white",
                      dense && "justify-center px-2",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId={`nav-indicator-${role}`}
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-ember-500"
                      />
                    )}
                    <Icon className="size-[18px] shrink-0" aria-hidden />
                    {!dense && <span className="truncate">{item.label}</span>}
                    {!dense && item.badge && (
                      <Badge tone="ember" size="sm" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-canvas">
      {/* ---------------- Desktop sidebar ---------------- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/8 bg-navy-950 transition-[width] duration-300 lg:flex",
          collapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-white/8 px-4",
            collapsed && "justify-center px-2",
          )}
        >
          {collapsed ? (
            <Link href="/" aria-label="Nirvona home">
              <LogoMark size="sm" onDark />
            </Link>
          ) : (
            <Logo onDark size="sm" compact />
          )}
        </div>

        {sidebarBody(collapsed)}

        <div className="shrink-0 border-t border-white/8 p-3">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.07] hover:text-white",
              collapsed && "justify-center px-2",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-[18px]" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="size-[18px]" aria-hidden />
                Collapse
              </>
            )}
          </button>
          <button
            type="button"
            onClick={signOut}
            className={cn(
              "mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-danger-500/15 hover:text-danger-500",
              collapsed && "justify-center px-2",
            )}
          >
            <LogOut className="size-[18px]" aria-hidden />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* ---------------- Mobile drawer ---------------- */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent
          side="left"
          title="Navigation"
          className="bg-navy-950 p-0"
          onClick={(event) => {
            // Close the drawer when a nav link inside it is followed.
            if ((event.target as HTMLElement).closest("a")) setDrawerOpen(false);
          }}
        >
          <div className="flex h-16 shrink-0 items-center border-b border-white/8 px-4">
            <Logo onDark size="sm" compact />
          </div>
          {sidebarBody(false)}
          <div className="shrink-0 border-t border-white/8 p-3">
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-danger-500/15 hover:text-danger-500"
            >
              <LogOut className="size-[18px]" aria-hidden />
              Logout
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ---------------- Content ---------------- */}
      <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              className="inline-flex size-9 items-center justify-center rounded-lg text-navy-900 transition-colors hover:bg-ink-100 lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <Link href="/" className="lg:hidden" aria-label="Nirvona home">
              <LogoMark size="sm" />
            </Link>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex"
                aria-label="Search"
              >
                <Link href={role === "admin" ? "/admin/students" : "/student/exams"}>
                  <Search />
                </Link>
              </Button>

              <Link
                href={notificationsHref}
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                className="relative inline-flex size-10 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 hover:text-navy-900"
              >
                <Bell className="size-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-ember-600 text-[0.5625rem] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <Dropdown>
                <DropdownTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-ink-100"
                  >
                    <Avatar name={session.name} size="sm" />
                    <span className="hidden min-w-0 text-left sm:block">
                      <span className="block truncate text-sm font-semibold leading-tight text-navy-900">
                        {session.name}
                      </span>
                      <span className="block text-2xs capitalize text-ink-500">
                        {role === "admin" ? "Administrator" : "Student"}
                      </span>
                    </span>
                    <ChevronDown className="size-4 text-ink-400" aria-hidden />
                  </button>
                </DropdownTrigger>
                <DropdownContent className="w-56">
                  <DropdownLabel>{session.email}</DropdownLabel>
                  <DropdownSeparator />
                  <DropdownItem asChild>
                    <Link href={profileHref}>
                      <User />
                      {role === "admin" ? "Admin profile" : "My profile"}
                    </Link>
                  </DropdownItem>
                  <DropdownItem asChild>
                    <Link href={role === "admin" ? "/admin/settings" : "/student/support"}>
                      <Settings />
                      {role === "admin" ? "Settings" : "Help & support"}
                    </Link>
                  </DropdownItem>
                  <DropdownSeparator />
                  <DropdownItem asChild>
                    <Link href={role === "admin" ? "/student/dashboard" : "/admin/dashboard"}>
                      <X className="rotate-45" />
                      Switch to {role === "admin" ? "student" : "admin"} demo
                    </Link>
                  </DropdownItem>
                  <DropdownItem destructive onSelect={() => void signOut()}>
                    <LogOut />
                    Logout
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            </div>
          </div>
        </header>

        <main id="main" className="px-4 pb-24 pt-6 sm:px-6 lg:pb-10 lg:pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ---------------- Mobile bottom nav ---------------- */}
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur-xl lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 px-1 py-2.5 text-[0.625rem] font-medium transition-colors",
                    active ? "text-ember-600" : "text-ink-500",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  <span className="max-w-full truncate">{item.label.split(" ")[0]}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex w-full flex-col items-center gap-1 px-1 py-2.5 text-[0.625rem] font-medium text-ink-500"
            >
              <Menu className="size-5" aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
