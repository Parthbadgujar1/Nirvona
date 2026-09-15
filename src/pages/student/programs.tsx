import { ProgramsView } from "@/components/student/programs-view";
import { usePageTitle } from "@/hooks/use-page-title";

export default function StudentProgramsPage() {
  usePageTitle("My Programs");
  return <ProgramsView />;
}
