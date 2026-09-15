import { PerformanceDashboard } from "@/components/student/performance-dashboard";
import { usePageTitle } from "@/hooks/use-page-title";

export default function StudentPerformancePage() {
  usePageTitle("Performance");
  return <PerformanceDashboard />;
}
