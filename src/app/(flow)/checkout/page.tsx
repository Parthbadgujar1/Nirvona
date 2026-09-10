import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutClient } from "@/components/public/checkout-client";
import { LoadingState } from "@/components/shared/states";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review your Nirvona package and complete your enrolment.",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingState label="Preparing your order" />}>
      <CheckoutClient />
    </Suspense>
  );
}
