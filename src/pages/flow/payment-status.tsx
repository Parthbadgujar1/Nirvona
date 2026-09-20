import { Suspense } from "react";
import { PaymentStatusClient } from "@/components/public/payment-status-client";
import { LoadingState } from "@/components/shared/states";
import { usePageTitle } from "@/hooks/use-page-title";

export default function PaymentStatusPage() {
  usePageTitle("Confirming Payment");
  return (
    <Suspense fallback={<LoadingState label="Confirming your payment" />}>
      <PaymentStatusClient />
    </Suspense>
  );
}
