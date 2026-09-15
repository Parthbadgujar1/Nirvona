import { SettingsView } from "@/components/admin/settings-view";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminSettingsPage() {
  usePageTitle("Settings");
  return <SettingsView />;
}
