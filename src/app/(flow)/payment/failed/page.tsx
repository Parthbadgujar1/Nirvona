import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentFailedClient } from "@/components/public/payment-failed-client";
import { LoadingState } from "@/components/shared/states";

export const metadata: Metadata = {
  title: "Payment Failed",
};

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PaymentFailedClient />
    </Suspense>
  );
}
