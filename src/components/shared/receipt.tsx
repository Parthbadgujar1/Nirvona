"use client";

import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Payment, Student } from "@/types";
import { cn } from "@/lib/utils";

/** Printable receipt. `print-sheet` strips shadows and margins for @media print. */
export function Receipt({
  payment,
  student,
  className,
}: {
  payment: Payment;
  student: Pick<Student, "id" | "fullName" | "email" | "mobile" | "city" | "state">;
  className?: string;
}) {
  const paid = payment.status === "successful";

  return (
    <article
      className={cn(
        "print-sheet mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-200 p-6 sm:p-8">
        <Logo href={null} size="md" />
        <div className="text-right">
          <p className="font-display text-lg font-bold text-navy-900">Payment Receipt</p>
          <p className="mt-0.5 text-xs text-ink-500">Receipt no. {payment.id}</p>
          <p className="mt-2">
            <Badge tone={paid ? "success" : payment.status === "pending" ? "warning" : "danger"} size="md">
              {paid ? "PAID" : payment.status.toUpperCase()}
            </Badge>
          </p>
        </div>
      </header>

      {/* Parties */}
      <div className="grid gap-6 border-b border-ink-100 p-6 sm:grid-cols-2 sm:p-8">
        <div>
          <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">Billed to</p>
          <p className="mt-2 font-display text-sm font-semibold text-navy-900">
            {student.fullName}
          </p>
          <address className="mt-1 not-italic text-sm leading-relaxed text-ink-600">
            Student ID: {student.id}
            <br />
            {student.email}
            <br />
            {student.mobile}
            <br />
            {student.city}, {student.state}
          </address>
        </div>
        <div className="sm:text-right">
          <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">Issued by</p>
          <p className="mt-2 font-display text-sm font-semibold text-navy-900">
            Nirvona Education Tech Pvt. Ltd.
          </p>
          <address className="mt-1 not-italic text-sm leading-relaxed text-ink-600">
            Plot 44, Sector 6, Malviya Nagar
            <br />
            Jaipur, Rajasthan 302017
            <br />
            GSTIN: 08AABCN1234F1Z5
            <br />
            support@nirvona.edu.in
          </address>
        </div>
      </div>

      {/* Line items */}
      <div className="p-6 sm:p-8">
        <table className="w-full text-sm">
          <caption className="sr-only">Receipt line items</caption>
          <thead>
            <tr className="border-b border-ink-200 text-left">
              <th scope="col" className="pb-2.5 text-2xs font-bold uppercase tracking-wider text-ink-400">
                Description
              </th>
              <th scope="col" className="pb-2.5 text-right text-2xs font-bold uppercase tracking-wider text-ink-400">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            <tr>
              <td className="py-3.5">
                <p className="font-medium text-navy-900">{payment.packageName}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  Duration: {payment.duration === "1Y" ? "1 Year" : payment.duration === "2Y" ? "2 Years" : payment.duration === "6M" ? "6 Months" : "3 Months"}
                </p>
              </td>
              <td className="py-3.5 text-right tabular text-navy-900">
                {formatCurrency(payment.amount)}
              </td>
            </tr>
            {payment.discount > 0 && (
              <tr>
                <td className="py-3 text-ink-600">Discount</td>
                <td className="py-3 text-right tabular font-medium text-success-600">
                  −{formatCurrency(payment.discount)}
                </td>
              </tr>
            )}
            <tr>
              <td className="py-3 text-ink-600">GST (18%)</td>
              <td className="py-3 text-right tabular text-navy-900">{formatCurrency(payment.tax)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-navy-900">
              <th scope="row" className="pt-4 text-left font-display text-base font-bold text-navy-900">
                Total paid
              </th>
              <td className="pt-4 text-right font-display text-xl font-extrabold tabular text-navy-900">
                {formatCurrency(payment.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        <dl className="mt-8 grid gap-4 rounded-xl bg-canvas p-5 sm:grid-cols-3">
          {[
            { label: "Payment date", value: formatDate(payment.date) },
            { label: "Payment method", value: payment.method },
            { label: "Transaction ID", value: payment.transactionId },
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                {item.label}
              </dt>
              <dd className="mt-1 truncate font-mono text-sm font-medium text-navy-900">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <footer className="border-t border-ink-100 bg-canvas px-6 py-5 sm:px-8">
        <p className="text-xs leading-relaxed text-ink-500">
          This is a computer-generated receipt and does not require a signature. Enrolment is
          refundable within 7 days of purchase provided no examination has been attempted under this
          package. For queries quote receipt number{" "}
          <span className="font-semibold text-navy-900">{payment.id}</span> at
          support@nirvona.edu.in.
        </p>
      </footer>
    </article>
  );
}
