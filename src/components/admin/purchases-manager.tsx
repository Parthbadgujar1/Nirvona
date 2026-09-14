"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Download, FileSpreadsheet, Filter, ShoppingCart, TrendingUp, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FilterBar, Pagination } from "@/components/shared/filters";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService } from "@/services/admin.service";
import { COURSES } from "@/data/courses";
import { getPackage } from "@/data/packages";
import { STUDENTS } from "@/data/students";
import { formatCurrency, formatDate } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";
import type { Payment } from "@/types";

const PAGE_SIZE = 10;

/** Columns of the "Successful Purchases" workbook, shown in the export dialog. */
const EXPORT_COLUMNS = [
  "Student ID", "Student Name", "Mobile", "Email", "Class", "Course", "Package",
  "Duration", "Amount", "Payment ID", "Purchase Date", "Payment Status",
];

export function PurchasesManager() {
  const payments = useAsync(() => adminService.payments(), []);

  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({
    course: "all",
    duration: "all",
    status: "successful",
  });
  const [page, setPage] = React.useState(1);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  if (payments.status === "error") return <ErrorState onRetry={payments.reload} />;
  if (payments.status === "loading" || !payments.data) {
    return <LoadingState label="Loading purchase records" />;
  }

  const all = payments.data;
  const student = (id: string) => STUDENTS.find((s) => s.id === id);

  const filtered = all.filter((payment) => {
    if (filters.course !== "all" && payment.courseSlug !== filters.course) return false;
    if (filters.duration !== "all" && payment.duration !== filters.duration) return false;
    if (filters.status !== "all" && payment.status !== filters.status) return false;
    if (search) {
      const haystack = `${payment.id} ${payment.studentName} ${payment.studentId} ${payment.packageName} ${payment.transactionId}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const successful = all.filter((p) => p.status === "successful");
  const revenue = successful.reduce((sum, p) => sum + p.total, 0);
  const exportable = filtered.filter((p) => p.status === "successful");

  const columns: Column<Payment>[] = [
    {
      key: "studentId",
      header: "Student",
      primary: true,
      sortValue: (row) => row.studentName,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-900">{row.studentName}</p>
          <p className="font-mono text-2xs text-ink-500">{row.studentId}</p>
        </div>
      ),
    },
    {
      key: "courseSlug",
      header: "Course",
      cell: (row) => (
        <Badge tone="navy" size="sm">
          {COURSES.find((c) => c.slug === row.courseSlug)?.shortName}
        </Badge>
      ),
    },
    {
      key: "packageName",
      header: "Package",
      cell: (row) => {
        const pkg = getPackage(row.packageId);
        return <span className="text-xs text-ink-600">{pkg?.durationLabel ?? row.duration}</span>;
      },
    },
    {
      key: "duration",
      header: "Duration",
      hideOnCard: true,
      cell: (row) => <span className="tabular text-ink-600">{row.duration}</span>,
    },
    {
      key: "total",
      header: "Amount",
      align: "right",
      sortValue: (row) => row.total,
      cell: (row) => (
        <span className="tabular font-semibold text-navy-900">{formatCurrency(row.total)}</span>
      ),
    },
    {
      key: "transactionId",
      header: "Payment ID",
      hideOnCard: true,
      cell: (row) => <span className="font-mono text-2xs text-ink-500">{row.transactionId}</span>,
    },
    {
      key: "date",
      header: "Purchase date",
      sortValue: (row) => row.date,
      cell: (row) => <span className="text-xs text-ink-600">{formatDate(row.date)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge kind="payment" status={row.status} size="sm" />,
    },
  ];

  async function runExport() {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 1200));
    const rows = exportable.map((payment) => {
      const s = student(payment.studentId);
      const pkg = getPackage(payment.packageId);
      return {
        "Student ID": payment.studentId,
        "Student Name": payment.studentName,
        Mobile: s?.mobile ?? "",
        Email: s?.email ?? "",
        Class: s?.className ?? "",
        Course: COURSES.find((c) => c.slug === payment.courseSlug)?.name ?? "",
        Package: pkg?.name ?? payment.packageName,
        Duration: pkg?.durationLabel ?? payment.duration,
        Amount: payment.total,
        "Payment ID": payment.transactionId,
        "Purchase Date": payment.date,
        "Payment Status": "Successful",
      };
    });
    exportRows(
      timestampedName("Nirvona_Successful_Purchases"),
      rows,
      EXPORT_COLUMNS.map((key) => ({ key, header: key })),
    );
    setExporting(false);
    setExportOpen(false);
    toast.success("Successful purchases exported", {
      description: `${rows.length} records written to an Excel-compatible file.`,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases & Enrollments"
        description="Every purchase attempt, with the filters applied to the export below."
        actions={
          <Button size="md" onClick={() => setExportOpen(true)}>
            <FileSpreadsheet />
            Download Successful Purchases
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total orders" numericValue={all.length} icon={ShoppingCart} accent="navy" />
        <StatCard
          label="Successful"
          numericValue={successful.length}
          icon={CheckCircle2}
          accent="success"
          hint={`${Math.round((successful.length / all.length) * 100)}% success rate`}
        />
        <StatCard
          label="Collected revenue"
          value={formatCurrency(revenue, { compact: true })}
          icon={Wallet}
          accent="ember"
        />
        <StatCard
          label="In current view"
          numericValue={filtered.length}
          icon={Filter}
          accent="royal"
          hint={`${exportable.length} exportable`}
        />
      </div>

      <Alert tone="info" title="Only successful purchases are exported">
        The download always contains successful transactions only — pending, failed and refunded
        orders are excluded regardless of the filters applied below.
      </Alert>

      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search by order ID, student, package or payment ID…"
        values={filters}
        resultCount={filtered.length}
        onChange={(id, value) => {
          setFilters((f) => ({ ...f, [id]: value }));
          setPage(1);
        }}
        onReset={() => {
          setFilters({ course: "all", duration: "all", status: "all" });
          setSearch("");
        }}
        filters={[
          {
            id: "course",
            label: "Course",
            options: COURSES.map((c) => ({ label: c.shortName, value: c.slug })),
          },
          {
            id: "duration",
            label: "Duration",
            options: [
              { label: "3 Months", value: "3M" },
              { label: "6 Months", value: "6M" },
              { label: "1 Year", value: "1Y" },
              { label: "2 Years", value: "2Y" },
            ],
          },
          {
            id: "status",
            label: "Payment",
            options: ["successful", "pending", "failed", "refunded"].map((s) => ({
              label: s,
              value: s,
            })),
          },
        ]}
      >
        <Button variant="secondary" size="sm" onClick={() => setExportOpen(true)}>
          <Download />
          Export
        </Button>
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No purchases match these filters"
          description="Adjust the filters to widen the result set."
          action={{
            label: "Clear filters",
            onClick: () => {
              setFilters({ course: "all", duration: "all", status: "all" });
              setSearch("");
            },
          }}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={paged}
            rowKey={(row) => row.id}
            stickyFirst
            caption="Purchase records"
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </>
      )}

      {/* Export dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-success-50 text-success-600 ring-1 ring-success-100">
              <FileSpreadsheet className="size-5" aria-hidden />
            </div>
            <DialogTitle>Download successful purchases</DialogTitle>
            <DialogDescription>
              An Excel-compatible file will be generated from the currently filtered records.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Records in view", value: filtered.length },
                { label: "Will be exported", value: exportable.length, tone: "text-success-600" },
                { label: "Excluded", value: filtered.length - exportable.length, tone: "text-ink-400" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-ink-200 bg-canvas p-4">
                  <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                    {item.label}
                  </p>
                  <p className={`mt-1 font-display text-2xl font-bold tabular ${item.tone ?? "text-navy-900"}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <h3 className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                Applied filters
              </h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {Object.entries(filters)
                  .filter(([, v]) => v !== "all")
                  .map(([key, value]) => (
                    <li key={key}>
                      <Badge tone="navy" size="sm">
                        {key}: {value}
                      </Badge>
                    </li>
                  ))}
                {search && (
                  <li>
                    <Badge tone="navy" size="sm">
                      search: {search}
                    </Badge>
                  </li>
                )}
                {Object.values(filters).every((v) => v === "all") && !search && (
                  <li className="text-sm text-ink-500">No filters applied — all records included.</li>
                )}
              </ul>
            </div>

            <div className="mt-5">
              <h3 className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                Columns in the workbook
              </h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {EXPORT_COLUMNS.map((column) => (
                  <li
                    key={column}
                    className="rounded-md bg-canvas px-2 py-1 font-mono text-2xs text-ink-600"
                  >
                    {column}
                  </li>
                ))}
              </ul>
            </div>

            {exporting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-5 rounded-xl border border-ink-200 bg-canvas p-4"
              >
                <p className="text-sm font-medium text-navy-900">Generating workbook…</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-200">
                  <motion.div
                    initial={{ width: "5%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="h-full rounded-full bg-brand-ember"
                  />
                </div>
              </motion.div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setExportOpen(false)} disabled={exporting}>
              Cancel
            </Button>
            <Button onClick={runExport} loading={exporting} disabled={exportable.length === 0}>
              <Download />
              Download {exportable.length} records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="flex flex-wrap items-center gap-4 p-5">
        <TrendingUp className="size-5 shrink-0 text-ember-600" aria-hidden />
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink-600">
          <span className="font-semibold text-navy-900">Reconciliation note:</span> gateway
          settlement typically lands T+2. Pending orders older than 72 hours should be checked
          against the gateway dashboard before being marked failed.
        </p>
      </Card>
    </div>
  );
}
