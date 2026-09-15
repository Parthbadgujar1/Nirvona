import { AdminDashboard } from "@/components/admin/dashboard";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminDashboardPage() {
  usePageTitle("Dashboard");
  return <AdminDashboard />;
}
