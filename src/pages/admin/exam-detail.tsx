import { useParams } from "react-router-dom";
import { ExamCandidates } from "@/components/admin/exam-candidates";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminExamDetailPage() {
  usePageTitle("Exam candidates");
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <ExamCandidates examId={id} />;
}
