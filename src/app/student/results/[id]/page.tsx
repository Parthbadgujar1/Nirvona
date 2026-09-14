import type { Metadata } from "next";
import { ResultDetail } from "@/components/student/result-detail";

export const metadata: Metadata = { title: "Result" };

export default async function StudentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResultDetail examId={id} />;
}
