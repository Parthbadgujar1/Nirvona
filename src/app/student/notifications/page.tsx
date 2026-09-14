import type { Metadata } from "next";
import { NotificationsView } from "@/components/student/notifications-view";

export const metadata: Metadata = { title: "Notifications" };

export default function StudentNotificationsPage() {
  return <NotificationsView />;
}
