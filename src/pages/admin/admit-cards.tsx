import { AdmitCardsManager } from "@/components/admin/admit-cards-manager";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminAdmitCardsPage() {
  usePageTitle("Admit Cards");
  return <AdmitCardsManager />;
}
