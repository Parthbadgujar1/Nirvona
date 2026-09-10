import type { Metadata } from "next";
import { CoursesOverview } from "@/components/admin/courses-overview";

export const metadata: Metadata = { title: "Courses" };

export default function AdminCoursesPage() {
  return <CoursesOverview />;
}
