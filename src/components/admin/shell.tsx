"use client";

import { PortalShell } from "@/components/shared/portal-shell";
import { adminNav } from "@/lib/nav";
import { useAsync } from "@/hooks/use-async";
import { adminService } from "@/services/admin.service";

const MOBILE_NAV = [adminNav[0], adminNav[1], adminNav[5], adminNav[11]];

export function AdminShell({ children }: { children: React.ReactNode }) {
  // Was a static mock-data count (ADMIN_NOTIFICATIONS.filter(...).length)
  // that never changed regardless of what was actually sent - now the
  // real count of notifications still pending or that failed delivery.
  const notifications = useAsync(() => adminService.notifications(), []);
  const pending = (notifications.data ?? []).filter(
    (n) => n.status === "pending" || n.status === "failed",
  ).length;

  return (
    <PortalShell
      role="admin"
      nav={adminNav}
      mobileNav={MOBILE_NAV}
      notificationsHref="/admin/notifications"
      profileHref="/admin/settings"
      unreadCount={pending}
    >
      {children}
    </PortalShell>
  );
}
