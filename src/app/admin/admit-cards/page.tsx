import type { Metadata } from "next";
import { AdmitCardsManager } from "@/components/admin/admit-cards-manager";

export const metadata: Metadata = { title: "Admit Cards" };

export default function AdminAdmitCardsPage() {
  return <AdmitCardsManager />;
}
