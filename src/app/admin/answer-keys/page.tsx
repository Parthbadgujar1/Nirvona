import type { Metadata } from "next";
import { AnswerKeysManager } from "@/components/admin/answer-keys-manager";

export const metadata: Metadata = { title: "Answer Keys" };

export default function AdminAnswerKeysPage() {
  return <AnswerKeysManager />;
}
