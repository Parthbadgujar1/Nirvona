import { ReportsCentre } from "@/components/admin/reports-centre";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminReportsPage() {
  usePageTitle("Reports");
  return <ReportsCentre />;
}
