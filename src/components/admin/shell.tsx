"use client";

import { PortalShell } from "@/components/shared/portal-shell";
import { adminNav } from "@/lib/nav";
import { ADMIN_NOTIFICATIONS } from "@/data/operations";

const MOBILE_NAV = [adminNav[0], adminNav[1], adminNav[5], adminNav[11]];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pending = ADMIN_NOTIFICATIONS.filter((n) => n.status === "pending" || n.status === "failed").length;
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
