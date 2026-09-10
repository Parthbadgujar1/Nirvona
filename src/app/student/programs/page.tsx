import type { Metadata } from "next";
import { ProgramsView } from "@/components/student/programs-view";

export const metadata: Metadata = { title: "My Programs" };

export default function StudentProgramsPage() {
  return <ProgramsView />;
}
