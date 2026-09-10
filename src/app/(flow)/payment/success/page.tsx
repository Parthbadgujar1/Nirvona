import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentSuccessClient } from "@/components/public/payment-success-client";
import { LoadingState } from "@/components/shared/states";

export const metadata: Metadata = {
  title: "Payment Successful",
};

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingState label="Confirming your payment" />}>
      <PaymentSuccessClient />
    </Suspense>
  );
}
