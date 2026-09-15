import { ExamsManager } from "@/components/admin/exams-manager";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminExamsPage() {
  usePageTitle("Exams");
  return <ExamsManager />;
}
