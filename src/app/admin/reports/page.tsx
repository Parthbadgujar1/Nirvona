import type { Metadata } from "next";
import { ReportsCentre } from "@/components/admin/reports-centre";

export const metadata: Metadata = { title: "Reports" };

export default function AdminReportsPage() {
  return <ReportsCentre />;
}
