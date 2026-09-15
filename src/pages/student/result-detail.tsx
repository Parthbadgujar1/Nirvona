import { useParams } from "react-router-dom";
import { ResultDetail } from "@/components/student/result-detail";
import { usePageTitle } from "@/hooks/use-page-title";

export default function StudentResultDetailPage() {
  usePageTitle("Result");
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <ResultDetail examId={id} />;
}
