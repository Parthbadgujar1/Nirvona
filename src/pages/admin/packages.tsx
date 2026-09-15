import { PackagesManager } from "@/components/admin/packages-manager";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminPackagesPage() {
  usePageTitle("Packages");
  return <PackagesManager />;
}
