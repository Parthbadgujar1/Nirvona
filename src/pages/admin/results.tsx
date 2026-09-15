import { ResultsManager } from "@/components/admin/results-manager";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminResultsPage() {
  usePageTitle("Results");
  return <ResultsManager />;
}
