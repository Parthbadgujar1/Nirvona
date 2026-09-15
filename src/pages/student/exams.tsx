import { StudentExams } from "@/components/student/exams";
import { usePageTitle } from "@/hooks/use-page-title";

export default function StudentExamsPage() {
  usePageTitle("My Exams");
  return <StudentExams />;
}
