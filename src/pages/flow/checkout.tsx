import { Suspense } from "react";
import { CheckoutClient } from "@/components/public/checkout-client";
import { LoadingState } from "@/components/shared/states";
import { usePageTitle } from "@/hooks/use-page-title";

export default function CheckoutPage() {
  usePageTitle("Checkout", "Review your Nirvona package and complete your enrolment.");
  return (
    <Suspense fallback={<LoadingState label="Preparing your order" />}>
      <CheckoutClient />
    </Suspense>
  );
}
