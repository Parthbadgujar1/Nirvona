"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, LifeBuoy, RefreshCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { getPackage } from "@/data/packages";
import { formatCurrency } from "@/lib/format";
import { priceOrder } from "@/services/checkout.service";

const CAUSES = [
  "Insufficient balance or a card limit on the account",
  "The bank declined the transaction for security reasons",
  "The payment window or UPI request timed out",
  "Incorrect card details, CVV or OTP",
];

export function PaymentFailedClient() {
  const params = useSearchParams();
  const packageId = params.get("package") ?? "";
  const reason = params.get("reason") ?? "The transaction could not be completed.";
  const pkg = getPackage(packageId);
  const summary = pkg ? priceOrder(pkg) : null;

  return (
    <div className="container-nv py-12 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl"
      >
        <Card className="overflow-hidden">
          <div className="border-b border-ink-100 px-6 py-10 text-center sm:px-10">
            <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 ring-1 ring-danger-100">
              <XCircle className="size-8" aria-hidden />
            </span>
            <h1 className="mt-6 font-display text-3xl font-bold text-navy-900">Payment Failed</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">{reason}</p>
            <p className="mt-2 text-sm text-ink-500">
              No enrolment was created and no amount has been captured.
            </p>
          </div>

          {pkg && summary && (
            <dl className="grid gap-4 border-b border-ink-100 p-6 sm:grid-cols-3">
              <div>
                <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">Package</dt>
                <dd className="mt-1 text-sm font-semibold text-navy-900">{pkg.name}</dd>
              </div>
              <div>
                <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                  Duration
                </dt>
                <dd className="mt-1 text-sm font-semibold text-navy-900">{pkg.durationLabel}</dd>
              </div>
              <div>
                <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">Amount</dt>
                <dd className="mt-1 text-sm font-semibold tabular text-navy-900">
                  {formatCurrency(summary.total)}
                </dd>
              </div>
            </dl>
          )}

          <div className="p-6">
            <h2 className="font-display text-sm font-semibold text-navy-900">
              Common reasons a payment fails
            </h2>
            <ul className="mt-3 space-y-2">
              {CAUSES.map((cause) => (
                <li key={cause} className="flex gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-300" aria-hidden />
                  <span className="text-sm leading-relaxed text-ink-600">{cause}</span>
                </li>
              ))}
            </ul>

            <Alert tone="info" className="mt-5" title="If money was debited">
              Failed transactions are auto-reversed by the payment gateway within 5–7 working days.
              If it has not returned by then, contact support with the time of the transaction.
            </Alert>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="flex-1">
                <Link href={pkg ? `/checkout?package=${pkg.id}` : "/packages"}>
                  <RefreshCcw />
                  Try payment again
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="flex-1">
                <Link href="/contact">
                  <LifeBuoy />
                  Contact support
                </Link>
              </Button>
            </div>

            <p className="mt-5 text-center">
              <Link
                href="/packages"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-navy-900"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back to packages
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
