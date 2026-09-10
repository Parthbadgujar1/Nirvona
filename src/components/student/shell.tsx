"use client";

import { PortalShell } from "@/components/shared/portal-shell";
import { studentNav } from "@/lib/nav";
import { STUDENT_NOTIFICATIONS } from "@/data/operations";

/**
 * Client boundary for the student portal chrome. Nav items carry icon
 * components, which cannot cross a server → client prop boundary, so the nav is
 * imported here rather than passed down from the layout.
 */
const MOBILE_NAV = [studentNav[0], studentNav[3], studentNav[5], studentNav[7]];

export function StudentShell({ children }: { children: React.ReactNode }) {
  const unread = STUDENT_NOTIFICATIONS.filter((n) => !n.read).length;
  return (
    <PortalShell
      role="student"
      nav={studentNav}
      mobileNav={MOBILE_NAV}
      notificationsHref="/student/notifications"
      profileHref="/student/profile"
      unreadCount={unread}
    >
      {children}
    </PortalShell>
  );
}
