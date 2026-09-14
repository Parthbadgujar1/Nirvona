import type { Metadata } from "next";
import { ResultsList } from "@/components/student/results-list";

export const metadata: Metadata = { title: "Results" };

export default function StudentResultsPage() {
  return <ResultsList />;
}
