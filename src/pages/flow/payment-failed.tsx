import { Suspense } from "react";
import { PaymentFailedClient } from "@/components/public/payment-failed-client";
import { LoadingState } from "@/components/shared/states";
import { usePageTitle } from "@/hooks/use-page-title";

export default function PaymentFailedPage() {
  usePageTitle("Payment Failed");
  return (
    <Suspense fallback={<LoadingState />}>
      <PaymentFailedClient />
    </Suspense>
  );
}
