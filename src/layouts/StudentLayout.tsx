import { Outlet } from "react-router-dom";
import { StudentShell } from "@/components/student/shell";

export function StudentLayout() {
  return (
    <StudentShell>
      <Outlet />
    </StudentShell>
  );
}
