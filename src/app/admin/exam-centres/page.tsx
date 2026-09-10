import type { Metadata } from "next";
import { CentresManager } from "@/components/admin/centres-manager";

export const metadata: Metadata = { title: "Exam Centres" };

export default function AdminCentresPage() {
  return <CentresManager />;
}
