import type { Metadata } from "next";
import { PerformanceDashboard } from "@/components/student/performance-dashboard";

export const metadata: Metadata = { title: "Performance" };

export default function StudentPerformancePage() {
  return <PerformanceDashboard />;
}
