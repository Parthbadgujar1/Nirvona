import { NotificationsView } from "@/components/student/notifications-view";
import { usePageTitle } from "@/hooks/use-page-title";

export default function StudentNotificationsPage() {
  usePageTitle("Notifications");
  return <NotificationsView />;
}
