import type { Metadata } from "next";
import { AdmitCardPage } from "@/components/student/admit-card-page";

export const metadata: Metadata = { title: "Admit Card" };

export default function StudentAdmitCardPage() {
  return <AdmitCardPage />;
}
