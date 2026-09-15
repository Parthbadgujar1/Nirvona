import { ResponsesManager } from "@/components/admin/responses-manager";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminResponsesPage() {
  usePageTitle("Student Responses");
  return <ResponsesManager />;
}
