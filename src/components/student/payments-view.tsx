"use client";

import * as React from "react";
import Link from "next/link";
import { CreditCard, Download, Printer, Receipt as ReceiptIcon, RotateCcw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { Receipt } from "@/components/shared/receipt";
import { useAsync } from "@/hooks/use-async";
import { studentService } from "@/services/student.service";
import { useOrders } from "@/hooks/use-orders";
import { CURRENT_STUDENT } from "@/data/students";
import { formatCurrency, formatDate } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";
import type { Payment } from "@/types";

export function PaymentsView() {
  const payments = useAsync(() => studentService.payments(), []);
  const { orders, hydrated } = useOrders();
  const [receipt, setReceipt] = React.useState<Payment | null>(null);

  if (payments.status === "error") return <ErrorState onRetry={payments.reload} />;
  if (payments.status === "loading" || !payments.data || !hydrated) {
    return <LoadingState label="Loading your payment history" />;
  }

  const all = [...orders, ...payments.data];
  const successful = all.filter((p) => p.status === "successful");
  const totalPaid = successful.reduce((sum, p) => sum + p.total, 0);

  const columns: Column<Payment>[] = [
    {
      key: "id",
      header: "Order ID",
      primary: true,
      sortValue: (row) => row.id,
      cell: (row) => <span className="font-mono text-xs font-semibold text-navy-900">{row.id}</span>,
    },
    {
      key: "packageName",
      header: "Package",
      sortValue: (row) => row.packageName,
      cell: (row) => (
        <div className="max-w-[16rem]">
          <p className="truncate font-medium text-navy-900">{row.packageName}</p>
          <p className="text-xs text-ink-500">{row.method}</p>
        </div>
      ),
    },
    {
      key: "total",
      header: "Amount",
      align: "right",
      sortValue: (row) => row.total,
      cell: (row) => <span className="tabular font-semibold text-navy-900">{formatCurrency(row.total)}</span>,
    },
    {
      key: "date",
      header: "Date",
      sortValue: (row) => row.date,
      cell: (row) => <span className="text-ink-600">{formatDate(row.date)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge kind="payment" status={row.status} />,
    },
    {
      key: "receipt",
      header: "Receipt",
      align: "right",
      cell: (row) =>
        row.status === "successful" ? (
          <Button variant="secondary" size="xs" onClick={() => setReceipt(row)}>
            <ReceiptIcon />
            View
          </Button>
        ) : row.status === "failed" ? (
          <Button asChild variant="ghost" size="xs">
            <Link href={`/checkout?package=${row.packageId}`}>
              <RotateCcw />
              Retry
            </Link>
          </Button>
        ) : (
          <span className="text-xs text-ink-400">—</span>
        ),
    },
  ];

  function exportHistory() {
    exportRows(
      timestampedName("Nirvona_PaymentHistory"),
      all as unknown as Record<string, unknown>[],
      [
        { key: "id", header: "Order ID" },
        { key: "packageName", header: "Package" },
        { key: "duration", header: "Duration" },
        { key: "amount", header: "Amount (INR)" },
        { key: "discount", header: "Discount (INR)" },
        { key: "tax", header: "GST (INR)" },
        { key: "total", header: "Total (INR)" },
        { key: "method", header: "Method" },
        { key: "transactionId", header: "Transaction ID" },
        { key: "date", header: "Date" },
        { key: "status", header: "Status" },
      ],
    );
    toast.success("Payment history downloaded");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Receipts"
        description="Every transaction on your account, with downloadable receipts for successful payments."
        breadcrumbs={[{ label: "Dashboard", href: "/student/dashboard" }, { label: "Payments" }]}
        actions={
          all.length > 0 && (
            <Button variant="secondary" size="md" onClick={exportHistory}>
              <Download />
              Export history
            </Button>
          )
        }
      />

      {all.length === 0 ? (
        <EmptyState
          branded
          icon={Wallet}
          title="No payment history"
          description="Once you purchase a package, your orders and receipts will appear here."
          action={{ label: "Browse packages", href: "/packages" }}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total paid"
              value={formatCurrency(totalPaid)}
              hint={`${successful.length} successful payment${successful.length === 1 ? "" : "s"}`}
              icon={Wallet}
              accent="success"
            />
            <StatCard
              label="Orders placed"
              numericValue={all.length}
              hint="Including failed and pending"
              icon={CreditCard}
              accent="navy"
            />
            <StatCard
              label="Active enrolments"
              numericValue={successful.length}
              hint="Programs you can appear for"
              icon={ReceiptIcon}
              accent="ember"
            />
          </div>

          <DataTable
            columns={columns}
            rows={all}
            rowKey={(row) => row.id}
            caption="Payment history"
          />
        </>
      )}

      <Dialog open={Boolean(receipt)} onOpenChange={(open) => !open && setReceipt(null)}>
        <DialogContent size="xl" className="p-0">
          <DialogHeader className="no-print">
            <DialogTitle>Receipt · {receipt?.id}</DialogTitle>
          </DialogHeader>
          {receipt && (
            <div className="px-6 pb-6">
              <Receipt payment={receipt} student={CURRENT_STUDENT} className="border-0 shadow-none" />
              <div className="mt-4 flex flex-wrap justify-end gap-2 no-print">
                <Button variant="secondary" size="sm" onClick={() => window.print()}>
                  <Printer />
                  Print
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    exportRows(
                      timestampedName(`Nirvona_Receipt_${receipt.id}`),
                      [receipt as unknown as Record<string, unknown>],
                      [
                        { key: "id", header: "Receipt No" },
                        { key: "studentId", header: "Student ID" },
                        { key: "studentName", header: "Student Name" },
                        { key: "packageName", header: "Package" },
                        { key: "amount", header: "Amount (INR)" },
                        { key: "discount", header: "Discount (INR)" },
                        { key: "tax", header: "GST (INR)" },
                        { key: "total", header: "Total (INR)" },
                        { key: "transactionId", header: "Transaction ID" },
                        { key: "date", header: "Payment Date" },
                        { key: "status", header: "Status" },
                      ],
                    );
                    toast.success("Receipt downloaded");
                  }}
                >
                  <Download />
                  Download Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
