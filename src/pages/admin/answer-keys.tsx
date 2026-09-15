import { AnswerKeysManager } from "@/components/admin/answer-keys-manager";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AdminAnswerKeysPage() {
  usePageTitle("Answer Keys");
  return <AnswerKeysManager />;
}
