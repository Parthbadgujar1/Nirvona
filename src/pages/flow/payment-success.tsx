import { Suspense } from "react";
import { PaymentSuccessClient } from "@/components/public/payment-success-client";
import { LoadingState } from "@/components/shared/states";
import { usePageTitle } from "@/hooks/use-page-title";

export default function PaymentSuccessPage() {
  usePageTitle("Payment Successful");
  return (
    <Suspense fallback={<LoadingState label="Confirming your payment" />}>
      <PaymentSuccessClient />
    </Suspense>
  );
}
