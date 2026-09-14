import type { Metadata } from "next";
import { PurchasesManager } from "@/components/admin/purchases-manager";

export const metadata: Metadata = { title: "Purchases" };

export default function AdminPurchasesPage() {
  return <PurchasesManager />;
}
