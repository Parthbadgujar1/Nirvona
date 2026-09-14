import type { Metadata } from "next";
import { CredentialsManager } from "@/components/admin/credentials-manager";

export const metadata: Metadata = { title: "Exam Credentials" };

export default function AdminCredentialsPage() {
  return <CredentialsManager />;
}
