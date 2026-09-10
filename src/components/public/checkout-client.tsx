"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, BadgePercent, Building2, CheckCircle2, CreditCard, Landmark, Lock, ShieldCheck,
  Smartphone, Wallet, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Steps } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/states";
import { LogoMark } from "@/components/brand/logo";
import { getPackage } from "@/data/packages";
import { getCourse } from "@/data/courses";
import { CURRENT_STUDENT } from "@/data/students";
import { formatCurrency } from "@/lib/format";
import { checkoutService, priceOrder } from "@/services/checkout.service";
import { useOrders } from "@/hooks/use-orders";
import { cn } from "@/lib/utils";

const METHODS = [
  { id: "upi", label: "UPI", detail: "Google Pay, PhonePe, Paytm", icon: Smartphone },
  { id: "card", label: "Card", detail: "Visa, Mastercard, RuPay", icon: CreditCard },
  { id: "netbanking", label: "Netbanking", detail: "All major banks", icon: Landmark },
  { id: "wallet", label: "Wallet", detail: "Paytm, Amazon Pay", icon: Wallet },
];

const CHECKOUT_STEPS = [
  { label: "Review", description: "Your order" },
  { label: "Payment", description: "Complete purchase" },
  { label: "Confirmation", description: "Receipt & access" },
];

export function CheckoutClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { addOrder } = useOrders();
  const packageId = params.get("package") ?? "";
  const pkg = getPackage(packageId);

  const [method, setMethod] = React.useState("upi");
  const [couponInput, setCouponInput] = React.useState("");
  const [coupon, setCoupon] = React.useState<{ code: string; percent: number } | null>(null);
  const [couponBusy, setCouponBusy] = React.useState(false);
  const [couponError, setCouponError] = React.useState<string>();
  const [processing, setProcessing] = React.useState(false);
  const [simulateFailure, setSimulateFailure] = React.useState(false);

  if (!pkg) {
    return (
      <div className="container-nv py-20">
        <EmptyState
          branded
          title="No package selected"
          description="Choose a package to continue to checkout. You can compare every program and duration on the packages page."
          action={{ label: "Browse packages", href: "/packages" }}
          secondaryAction={{ label: "View programs", href: "/courses" }}
        />
      </div>
    );
  }

  const course = getCourse(pkg.courseSlug)!;
  const summary = priceOrder(pkg, coupon?.percent ?? 0);

  async function applyCoupon(event: React.FormEvent) {
    event.preventDefault();
    if (!couponInput.trim()) return;
    setCouponBusy(true);
    setCouponError(undefined);
    try {
      const result = await checkoutService.applyCoupon(couponInput);
      setCoupon(result);
      toast.success(`Coupon ${result.code} applied`, {
        description: `${result.percent}% off your package price.`,
      });
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : "Invalid coupon.");
    } finally {
      setCouponBusy(false);
    }
  }

  async function pay() {
    setProcessing(true);
    try {
      const order = await checkoutService.createOrder(pkg!, summary, simulateFailure);
      addOrder(order);
      router.push(`/payment/success?order=${order.id}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Payment failed";
      router.push(
        `/payment/failed?package=${pkg!.id}&reason=${encodeURIComponent(reason)}`,
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      {/* Full-screen processing overlay */}
      <AnimatePresence>
        {processing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-navy-950/92 px-6 text-center backdrop-blur-sm"
          >
            <span className="relative flex size-20 items-center justify-center">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-white/25" />
              <span className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                <LogoMark size="lg" />
              </span>
            </span>
            <h2 className="mt-8 font-display text-2xl font-bold text-white">Processing payment</h2>
            <p className="mt-2 max-w-sm text-sm text-white/65">
              Confirming your transaction with the payment gateway. Please do not refresh or close
              this page.
            </p>
            <div className="mt-8 h-1 w-56 overflow-hidden rounded-full bg-white/15">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                className="h-full w-1/2 rounded-full bg-brand-ember"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container-nv py-8 lg:py-12">
        <Steps steps={CHECKOUT_STEPS} current={1} className="mx-auto max-w-2xl" />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8">
          {/* Left: details */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold text-navy-900">Student details</h2>
              <p className="mt-1 text-sm text-ink-500">
                Your enrolment will be created against this account.
              </p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Full name", value: CURRENT_STUDENT.fullName },
                  { label: "Student ID", value: CURRENT_STUDENT.id },
                  { label: "Email", value: CURRENT_STUDENT.email },
                  { label: "Mobile", value: CURRENT_STUDENT.mobile },
                  { label: "Class", value: CURRENT_STUDENT.className },
                  { label: "City", value: `${CURRENT_STUDENT.city}, ${CURRENT_STUDENT.state}` },
                ].map((item) => (
                  <div key={item.label} className="min-w-0">
                    <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                      {item.label}
                    </dt>
                    <dd className="mt-0.5 truncate text-sm font-medium text-navy-900">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 border-t border-ink-100 pt-4 text-xs text-ink-500">
                Wrong details?{" "}
                <Link href="/student/profile" className="font-semibold text-royal-700 hover:underline">
                  Update your profile
                </Link>{" "}
                before completing payment.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold text-navy-900">Payment method</h2>
              <p className="mt-1 text-sm text-ink-500">
                All methods are processed through a PCI-DSS compliant gateway.
              </p>

              <fieldset className="mt-5">
                <legend className="sr-only">Choose a payment method</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {METHODS.map(({ id, label, detail, icon: Icon }) => (
                    <label
                      key={id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all",
                        method === id
                          ? "border-navy-900 bg-navy-50/60 ring-1 ring-navy-900"
                          : "border-ink-200 hover:border-navy-200",
                      )}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={id}
                        checked={method === id}
                        onChange={() => setMethod(id)}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-lg",
                          method === id ? "bg-navy-900 text-white" : "bg-ink-100 text-ink-500",
                        )}
                      >
                        <Icon className="size-[18px]" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-navy-900">{label}</span>
                        <span className="block truncate text-xs text-ink-500">{detail}</span>
                      </span>
                      {method === id && (
                        <CheckCircle2 className="ml-auto size-4 shrink-0 text-navy-900" aria-hidden />
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>

              <Alert tone="neutral" className="mt-5">
                <p className="text-xs leading-relaxed">
                  This is a frontend prototype. No payment gateway is connected and no money is
                  charged — pressing pay simulates a gateway round-trip.
                </p>
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-700">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="size-4 rounded border-ink-300 accent-navy-900"
                  />
                  Simulate a declined payment (to preview the failure screen)
                </label>
              </Alert>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold text-navy-900">
                What happens after payment
              </h2>
              <ol className="mt-4 space-y-3">
                {[
                  "Your enrolment activates immediately and appears in My Programs",
                  "A receipt is generated and emailed to you",
                  "You are entered into the candidate list for upcoming examinations",
                  "Your admit card is published 7 days before each examination",
                ].map((item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-navy-900 text-2xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-ink-600">{item}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          {/* Right: order summary */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Card className="overflow-hidden">
              <div className="border-b border-ink-100 bg-ink-50/70 px-6 py-4">
                <h2 className="font-display text-base font-semibold text-navy-900">
                  Order summary
                </h2>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 font-display text-xs font-bold text-navy-800">
                    {course.shortName.replace("Class ", "C")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold text-navy-900">{pkg.name}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {pkg.tests} CBT examinations · {pkg.durationMonths} months access
                    </p>
                    {pkg.recommended && (
                      <Badge tone="ember" size="sm" className="mt-2">
                        Most chosen
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Coupon */}
                <div className="mt-6 border-t border-ink-100 pt-5">
                  {coupon ? (
                    <div className="flex items-center justify-between rounded-lg border border-success-500/30 bg-success-50 px-3.5 py-2.5">
                      <span className="flex items-center gap-2 text-sm font-semibold text-success-700">
                        <BadgePercent className="size-4" aria-hidden />
                        {coupon.code} · {coupon.percent}% off
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCoupon(null);
                          setCouponInput("");
                          toast.info("Coupon removed");
                        }}
                        className="rounded p-1 text-success-700 transition-colors hover:bg-success-100"
                        aria-label="Remove coupon"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={applyCoupon}>
                      <Field label="Coupon code" htmlFor="coupon" error={couponError} hint="Try NIRVONA10">
                        <div className="flex gap-2">
                          <Input
                            id="coupon"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value);
                              setCouponError(undefined);
                            }}
                            placeholder="Enter code"
                            className="uppercase"
                            invalid={Boolean(couponError)}
                          />
                          <Button
                            type="submit"
                            variant="secondary"
                            size="md"
                            loading={couponBusy}
                            disabled={!couponInput.trim()}
                          >
                            Apply
                          </Button>
                        </div>
                      </Field>
                    </form>
                  )}
                </div>

                {/* Price breakdown */}
                <dl className="mt-6 space-y-2.5 border-t border-ink-100 pt-5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink-500">Package price</dt>
                    <dd className="tabular text-navy-900">{formatCurrency(summary.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-500">Discount</dt>
                    <dd className="tabular font-medium text-success-600">
                      −{formatCurrency(summary.discount)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-500">Taxable value</dt>
                    <dd className="tabular text-navy-900">{formatCurrency(summary.taxableValue)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-500">GST (18%)</dt>
                    <dd className="tabular text-navy-900">{formatCurrency(summary.gst)}</dd>
                  </div>
                  <div className="flex items-end justify-between border-t border-ink-200 pt-3">
                    <dt className="font-display text-base font-semibold text-navy-900">Total</dt>
                    <dd className="font-display text-2xl font-extrabold tabular text-navy-900">
                      {formatCurrency(summary.total)}
                    </dd>
                  </div>
                </dl>

                <Button size="xl" block className="mt-6" onClick={pay} loading={processing}>
                  Proceed to Payment
                  <ArrowRight />
                </Button>

                <ul className="mt-5 space-y-2 border-t border-ink-100 pt-5">
                  {[
                    { icon: Lock, text: "256-bit encrypted transaction" },
                    { icon: ShieldCheck, text: "7-day refund window before your first exam" },
                    { icon: Building2, text: "GST invoice issued instantly" },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-2 text-xs text-ink-500">
                      <Icon className="size-3.5 shrink-0 text-ink-400" aria-hidden />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <p className="mt-4 text-center text-xs text-ink-400">
              Changed your mind?{" "}
              <Link href={`/packages/${pkg.id}`} className="font-semibold text-royal-700 hover:underline">
                Review package details
              </Link>
            </p>
          </aside>
        </div>
      </div>
    </>
  );
}
