import { CentresManager } from "@/components/admin/centres-manager";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminExamCentresPage() {
  usePageTitle("Exam Centres");
  return <CentresManager />;
}
