import { PurchasesManager } from "@/components/admin/purchases-manager";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminPurchasesPage() {
  usePageTitle("Purchases");
  return <PurchasesManager />;
}
