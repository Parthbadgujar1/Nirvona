import type { Metadata } from "next";
import { ExamCandidates } from "@/components/admin/exam-candidates";

export const metadata: Metadata = { title: "Exam candidates" };

export default async function AdminExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExamCandidates examId={id} />;
}
