import { CoursesOverview } from "@/components/admin/courses-overview";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminCoursesPage() {
  usePageTitle("Courses");
  return <CoursesOverview />;
}
