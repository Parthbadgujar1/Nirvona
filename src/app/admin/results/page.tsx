import type { Metadata } from "next";
import { ResultsManager } from "@/components/admin/results-manager";

export const metadata: Metadata = { title: "Results" };

export default function AdminResultsPage() {
  return <ResultsManager />;
}
