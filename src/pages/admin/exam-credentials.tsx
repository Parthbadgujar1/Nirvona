import { CredentialsManager } from "@/components/admin/credentials-manager";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminExamCredentialsPage() {
  usePageTitle("Exam Credentials");
  return <CredentialsManager />;
}
