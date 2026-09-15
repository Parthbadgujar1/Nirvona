import { NotificationsManager } from "@/components/admin/notifications-manager";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminNotificationsPage() {
  usePageTitle("Notifications");
  return <NotificationsManager />;
}
