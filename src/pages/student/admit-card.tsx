import { AdmitCardPage } from "@/components/student/admit-card-page";
import { usePageTitle } from "@/hooks/use-page-title";

export default function StudentAdmitCardPage() {
  usePageTitle("Admit Card");
  return <AdmitCardPage />;
}
