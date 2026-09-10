import type { Metadata } from "next";
import { ResponsesManager } from "@/components/admin/responses-manager";

export const metadata: Metadata = { title: "Student Responses" };

export default function AdminResponsesPage() {
  return <ResponsesManager />;
}
