import { PaymentsView } from "@/components/student/payments-view";
import { usePageTitle } from "@/hooks/use-page-title";

export default function StudentPaymentsPage() {
  usePageTitle("Payments & Receipts");
  return <PaymentsView />;
}
