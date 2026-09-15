import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminAnalyticsPage() {
  usePageTitle("Analytics");
  return <AnalyticsDashboard />;
}
