import { StudentsManager } from "@/components/admin/students-manager";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminStudentsPage() {
  usePageTitle("Students");
  return <StudentsManager />;
}
