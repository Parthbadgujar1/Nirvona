import type { Metadata } from "next";
import { StudentShell } from "@/components/student/shell";

export const metadata: Metadata = {
  title: { default: "Student Portal", template: "%s · Nirvona Student Portal" },
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
