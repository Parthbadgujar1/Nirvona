import { ResultsList } from "@/components/student/results-list";
import { usePageTitle } from "@/hooks/use-page-title";

export default function StudentResultsPage() {
  usePageTitle("Results");
  return <ResultsList />;
}
