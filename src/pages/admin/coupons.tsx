import { CouponsManager } from "@/components/admin/coupons-manager";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminCouponsPage() {
  usePageTitle("Coupons");
  return <CouponsManager />;
}
