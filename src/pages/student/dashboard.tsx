import { StudentDashboard } from "@/components/student/dashboard";
import { usePageTitle } from "@/hooks/use-page-title";

export default function StudentDashboardPage() {
  usePageTitle("Dashboard");
  return <StudentDashboard />;
}
