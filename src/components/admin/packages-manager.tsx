"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Boxes, Download, Sparkles, Tag, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FilterBar } from "@/components/shared/filters";
import { EmptyState } from "@/components/shared/states";
import { COURSES } from "@/data/courses";
import { PACKAGES } from "@/data/packages";
import { PAYMENTS } from "@/data/payments";
import { formatCurrency, formatNumber } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";
import type { Package } from "@/types";

export function PackagesManager() {
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({ course: "all", duration: "all" });

  const salesFor = (id: string) =>
    PAYMENTS.filter((p) => p.packageId === id && p.status === "successful").length;

  const filtered = PACKAGES.filter((pkg) => {
    if (filters.course !== "all" && pkg.courseSlug !== filters.course) return false;
    if (filters.duration !== "all" && pkg.duration !== filters.duration) return false;
    if (search && !pkg.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns: Column<Package>[] = [
    {
      key: "name",
      header: "Package",
      primary: true,
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-900">{row.name}</p>
          <p className="font-mono text-2xs text-ink-500">{row.id}</p>
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
      key: "durationLabel",
      header: "Duration",
      sortValue: (row) => row.durationMonths,
      cell: (row) => <span className="text-ink-600">{row.durationLabel}</span>,
    },
    {
      key: "tests",
      header: "Tests",
      align: "right",
      sortValue: (row) => row.tests,
      cell: (row) => <span className="tabular text-ink-700">{row.tests}</span>,
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      sortValue: (row) => row.price,
      cell: (row) => (
        <div className="text-right">
          <p className="tabular font-semibold text-navy-900">{formatCurrency(row.price)}</p>
          {row.originalPrice && (
            <p className="tabular text-2xs text-ink-400 line-through">
              {formatCurrency(row.originalPrice)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "discountPercent",
      header: "Discount",
      align: "right",
      sortValue: (row) => row.discountPercent ?? 0,
      cell: (row) =>
        row.discountPercent ? (
          <Badge tone="success" size="sm">
            {row.discountPercent}%
          </Badge>
        ) : (
          <span className="text-xs text-ink-300">—</span>
        ),
    },
    {
      key: "sales",
      header: "Sold",
      align: "right",
      sortValue: (row) => salesFor(row.id),
      cell: (row) => <span className="tabular text-ink-700">{salesFor(row.id)}</span>,
    },
    {
      key: "recommended",
      header: "Flags",
      cell: (row) =>
        row.recommended ? (
          <Badge tone="ember" size="sm">
            <Sparkles aria-hidden />
            Recommended
          </Badge>
        ) : (
          <span className="text-xs text-ink-300">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      hideOnCard: true,
      cell: (row) => (
        <Button asChild variant="secondary" size="xs">
          <Link href={`/packages/${row.id}`}>
            View
            <ArrowUpRight />
          </Link>
        </Button>
      ),
    },
  ];

  const revenue = PAYMENTS.filter((p) => p.status === "successful").reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Packages"
        description="Pricing, duration and inclusions for every package across the five programs."
        actions={
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              exportRows(
                timestampedName("Nirvona_Packages"),
                filtered.map((pkg) => ({
                  "Package ID": pkg.id,
                  "Package Name": pkg.name,
                  Course: pkg.courseSlug,
                  Duration: pkg.durationLabel,
                  Months: pkg.durationMonths,
                  Tests: pkg.tests,
                  Price: pkg.price,
                  "Original Price": pkg.originalPrice ?? "",
                  "Discount %": pkg.discountPercent ?? "",
                  Recommended: pkg.recommended ? "Yes" : "No",
                  "Units Sold": salesFor(pkg.id),
                })),
                [
                  "Package ID", "Package Name", "Course", "Duration", "Months", "Tests", "Price",
                  "Original Price", "Discount %", "Recommended", "Units Sold",
                ].map((key) => ({ key, header: key })),
              );
              toast.success("Package catalogue exported");
            }}
          >
            <Download />
            Export catalogue
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total packages" numericValue={PACKAGES.length} icon={Boxes} accent="navy" />
        <StatCard
          label="Average price"
          value={formatCurrency(
            Math.round(PACKAGES.reduce((s, p) => s + p.price, 0) / PACKAGES.length),
          )}
          icon={Tag}
          accent="royal"
        />
        <StatCard
          label="Recommended"
          numericValue={PACKAGES.filter((p) => p.recommended).length}
          icon={Sparkles}
          accent="ember"
          hint="one per program"
        />
        <StatCard
          label="Revenue attributed"
          value={formatCurrency(revenue, { compact: true })}
          icon={TrendingUp}
          accent="success"
        />
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search package name…"
        values={filters}
        resultCount={filtered.length}
        onChange={(id, value) => setFilters((f) => ({ ...f, [id]: value }))}
        onReset={() => {
          setFilters({ course: "all", duration: "all" });
          setSearch("");
        }}
        filters={[
          { id: "course", label: "Course", options: COURSES.map((c) => ({ label: c.shortName, value: c.slug })) },
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
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No packages match these filters"
          description="Clear the filters to see the full catalogue."
          action={{
            label: "Clear filters",
            onClick: () => {
              setFilters({ course: "all", duration: "all" });
              setSearch("");
            },
          }}
        />
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(row) => row.id} stickyFirst caption="Package catalogue" />
      )}

      <Card className="p-5">
        <h2 className="font-display text-base font-semibold text-navy-900">Best sellers</h2>
        <p className="mt-1 text-xs text-ink-500">Packages ranked by successful purchases.</p>
        <ol className="mt-4 space-y-3">
          {[...PACKAGES]
            .sort((a, b) => salesFor(b.id) - salesFor(a.id))
            .slice(0, 5)
            .map((pkg, index) => (
              <li
                key={pkg.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-200 p-4"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-2xs font-bold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-900">{pkg.name}</p>
                  <p className="text-xs text-ink-500">
                    {pkg.tests} tests · {formatCurrency(pkg.price)}
                  </p>
                </div>
                <span className="tabular text-sm font-semibold text-ember-600">
                  {formatNumber(salesFor(pkg.id))} sold
                </span>
              </li>
            ))}
        </ol>
      </Card>
    </div>
  );
}
