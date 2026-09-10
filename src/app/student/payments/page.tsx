import type { Metadata } from "next";
import { PaymentsView } from "@/components/student/payments-view";

export const metadata: Metadata = { title: "Payments & Receipts" };

export default function StudentPaymentsPage() {
  return <PaymentsView />;
}
