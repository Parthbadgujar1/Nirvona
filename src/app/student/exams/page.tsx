import type { Metadata } from "next";
import { StudentExams } from "@/components/student/exams";

export const metadata: Metadata = { title: "My Exams" };

export default function StudentExamsPage() {
  return <StudentExams />;
}
