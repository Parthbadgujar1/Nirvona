import { PackagesView } from "@/components/student/packages-view";
import { usePageTitle } from "@/hooks/use-page-title";

export default function StudentPackagesPage() {
  usePageTitle("Browse packages");
  return <PackagesView />;
}
