import type { Metadata } from "next";
import { ExamsManager } from "@/components/admin/exams-manager";

export const metadata: Metadata = { title: "Exams" };

export default function AdminExamsPage() {
  return <ExamsManager />;
}
