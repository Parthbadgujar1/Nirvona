"use client";

import { PortalShell } from "@/components/shared/portal-shell";
import { studentNav } from "@/lib/nav";
import { useAsync } from "@/hooks/use-async";
import { studentService } from "@/services/student.service";

/**
 * Client boundary for the student portal chrome. Nav items carry icon
 * components, which cannot cross a server → client prop boundary, so the nav is
 * imported here rather than passed down from the layout.
 */
const MOBILE_NAV = ["/student/dashboard", "/student/exams", "/student/results", "/student/performance"]
  .map((href) => studentNav.find((item) => item.href === href)!)
  .filter(Boolean);

export function StudentShell({ children }: { children: React.ReactNode }) {
  // Was a static mock-data count (STUDENT_NOTIFICATIONS.filter(...).length)
  // that never changed no matter who was signed in or what actually
  // happened - now the real per-student unread count.
  const unread = useAsync(() => studentService.unreadNotificationCount(), []);

  return (
    <PortalShell
      role="student"
      nav={studentNav}
      mobileNav={MOBILE_NAV}
      notificationsHref="/student/notifications"
      profileHref="/student/profile"
      unreadCount={unread.data ?? 0}
    >
      {children}
    </PortalShell>
  );
}
