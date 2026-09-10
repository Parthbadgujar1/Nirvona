"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck, CheckCircle2, Download, Printer, Receipt as ReceiptIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Steps } from "@/components/ui/progress";
import { Receipt } from "@/components/shared/receipt";
import { EmptyState } from "@/components/shared/states";
import { useOrders } from "@/hooks/use-orders";
import { STUDENT_PAYMENTS } from "@/data/payments";
import { CURRENT_STUDENT } from "@/data/students";
import { getPackage } from "@/data/packages";
import { formatCurrency, formatDate } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";

const CHECKOUT_STEPS = [
  { label: "Review", description: "Your order" },
  { label: "Payment", description: "Complete purchase" },
  { label: "Confirmation", description: "Receipt & access" },
];

export function PaymentSuccessClient() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const { orders, hydrated } = useOrders();
  const [showReceipt, setShowReceipt] = React.useState(false);

  const payment =
    orders.find((o) => o.id === orderId) ??
    STUDENT_PAYMENTS.find((o) => o.id === orderId) ??
    (hydrated && !orderId ? STUDENT_PAYMENTS[0] : undefined);

  if (hydrated && !payment) {
    return (
      <div className="container-nv py-20">
        <EmptyState
          branded
          title="Order not found"
          description="We could not find that order. If you have just paid, check your email for the receipt or open your payments history."
          action={{ label: "View payment history", href: "/student/payments" }}
          secondaryAction={{ label: "Browse packages", href: "/packages" }}
        />
      </div>
    );
  }

  if (!payment) {
    return <div className="container-nv py-20" aria-busy="true" />;
  }

  const pkg = getPackage(payment.packageId);
  const endDate = (() => {
    const date = new Date(payment.date);
    date.setMonth(date.getMonth() + (pkg?.durationMonths ?? 12));
    return date.toISOString().slice(0, 10);
  })();

  function downloadReceipt() {
    exportRows(
      timestampedName(`Nirvona_Receipt_${payment!.id}`),
      [
        {
          "Receipt No": payment!.id,
          "Student ID": CURRENT_STUDENT.id,
          "Student Name": CURRENT_STUDENT.fullName,
          Package: payment!.packageName,
          Duration: payment!.duration,
          Amount: payment!.amount,
          Discount: payment!.discount,
          GST: payment!.tax,
          Total: payment!.total,
          "Payment Method": payment!.method,
          "Transaction ID": payment!.transactionId,
          "Payment Date": payment!.date,
          Status: "PAID",
        },
      ],
      [
        { key: "Receipt No", header: "Receipt No" },
        { key: "Student ID", header: "Student ID" },
        { key: "Student Name", header: "Student Name" },
        { key: "Package", header: "Package" },
        { key: "Duration", header: "Duration" },
        { key: "Amount", header: "Amount (INR)" },
        { key: "Discount", header: "Discount (INR)" },
        { key: "GST", header: "GST (INR)" },
        { key: "Total", header: "Total Paid (INR)" },
        { key: "Payment Method", header: "Payment Method" },
        { key: "Transaction ID", header: "Transaction ID" },
        { key: "Payment Date", header: "Payment Date" },
        { key: "Status", header: "Status" },
      ],
    );
    toast.success("Receipt downloaded");
  }

  return (
    <div className="container-nv py-8 lg:py-12">
      <Steps steps={CHECKOUT_STEPS} current={2} className="mx-auto max-w-2xl no-print" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-10 max-w-3xl no-print"
      >
        <Card className="overflow-hidden">
          <div className="relative overflow-hidden bg-brand-navy px-6 py-10 text-center text-white sm:px-10">
            <div aria-hidden className="absolute inset-0 dot-backdrop opacity-10" />
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative mx-auto flex size-16 items-center justify-center rounded-2xl bg-success-500 shadow-lg"
            >
              <CheckCircle2 className="size-8 text-white" aria-hidden />
            </motion.span>
            <h1 className="relative mt-6 font-display text-3xl font-bold text-white">
              Payment Successful
            </h1>
            <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
              Your enrolment is active. A receipt has been emailed to{" "}
              <span className="font-medium text-white">{CURRENT_STUDENT.email}</span>.
            </p>
            <p className="relative mt-6 font-display text-4xl font-extrabold tabular text-white">
              {formatCurrency(payment.total)}
            </p>
          </div>

          <dl className="grid divide-y divide-ink-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
            {[
              { label: "Order ID", value: payment.id },
              { label: "Student ID", value: CURRENT_STUDENT.id },
              { label: "Package", value: payment.packageName },
              { label: "Amount paid", value: formatCurrency(payment.total) },
              { label: "Payment date", value: formatDate(payment.date) },
              { label: "Transaction ID", value: payment.transactionId },
            ].map((item) => (
              <div key={item.label} className="border-b border-ink-100 p-5 sm:border-r">
                <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                  {item.label}
                </dt>
                <dd className="mt-1 break-words text-sm font-semibold text-navy-900">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-3 border-t border-ink-100 p-6 sm:flex-row">
            <Button size="lg" className="flex-1" onClick={downloadReceipt}>
              <Download />
              Download Receipt
            </Button>
            <Button asChild variant="navy" size="lg" className="flex-1">
              <Link href="/student/dashboard">
                Go to Dashboard
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="mt-6 p-6">
          <div className="flex items-center gap-2.5">
            <CalendarCheck className="size-5 text-ember-600" aria-hidden />
            <h2 className="font-display text-base font-semibold text-navy-900">
              Your enrolment is active
            </h2>
          </div>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Program", value: pkg ? pkg.name.split(" — ")[0] : payment.packageName },
              { label: "Access from", value: formatDate(payment.date) },
              { label: "Access until", value: formatDate(endDate) },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                  {item.label}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-navy-900">{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 border-t border-ink-100 pt-4 text-sm leading-relaxed text-ink-500">
            You are now on the candidate list for upcoming examinations in this program. Your admit
            card — including your exam-hall login credentials — is published in your portal 7 days
            before each examination.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/student/exams">View upcoming exams</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowReceipt((s) => !s)}>
              <ReceiptIcon />
              {showReceipt ? "Hide receipt" : "Preview receipt"}
            </Button>
          </div>
        </Card>
      </motion.div>

      {showReceipt && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-8"
        >
          <div className="mb-4 flex justify-center gap-2 no-print">
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer />
              Print receipt
            </Button>
            <Button variant="secondary" size="sm" onClick={downloadReceipt}>
              <Download />
              Download as spreadsheet
            </Button>
          </div>
          <Receipt payment={payment} student={CURRENT_STUDENT} />
        </motion.div>
      )}
    </div>
  );
}
