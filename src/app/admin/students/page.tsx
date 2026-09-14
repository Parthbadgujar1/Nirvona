import type { Metadata } from "next";
import { StudentsManager } from "@/components/admin/students-manager";

export const metadata: Metadata = { title: "Students" };

export default function AdminStudentsPage() {
  return <StudentsManager />;
}
