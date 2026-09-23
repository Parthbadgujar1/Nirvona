import { ChangeRequestsManager } from "@/components/admin/change-requests-manager";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminChangeRequestsPage() {
  usePageTitle("Change requests");
  return <ChangeRequestsManager />;
}
