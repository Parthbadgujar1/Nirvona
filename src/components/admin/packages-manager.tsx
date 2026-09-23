"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, Boxes, Download, MoreHorizontal, Pencil, Plus, Sparkles, Tag, Trash2, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger,
} from "@/components/ui/dropdown";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FilterBar } from "@/components/shared/filters";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { adminService } from "@/services/admin.service";
import { formatCurrency, formatNumber } from "@/lib/format";
import { exportRows, timestampedName } from "@/lib/export";
import type { Package } from "@/types";

const EMPTY_DRAFT = {
  courseSlug: "",
  name: "",
  duration: "3M" as Package["duration"],
  durationLabel: "3 Months",
  durationMonths: "3",
  price: "2999",
  originalPrice: "",
  discountPercent: "",
  tier: "",
  tests: "6",
  recommended: false,
  status: "active",
  tagline: "",
  features: "",
  benefits: "",
  includes: {
    examAccess: true,
    analytics: true,
    answerKey: true,
    doubtSupport: false,
    mentorship: false,
    printedMaterial: false,
  },
};

function linesToList(value: string): string[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function PackagesManager() {
  const packagesAsync = useAsync(() => adminService.packages(), []);
  const courses = useAsync(() => adminService.courses(), []);
  // Real orders - "Sold" and revenue used to be counted from bundled mock payments.
  const paymentsAsync = useAsync(() => adminService.payments(), []);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({ course: "all", duration: "all" });
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Package | null>(null);
  const [draft, setDraft] = React.useState(EMPTY_DRAFT);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Package | null>(null);

  if (packagesAsync.status === "error") return <ErrorState onRetry={packagesAsync.reload} />;
  if (packagesAsync.status === "loading" || !packagesAsync.data) {
    return <LoadingState label="Loading packages" />;
  }

  const PACKAGES = packagesAsync.data;
  const COURSES = courses.data ?? [];

  const PAYMENTS = paymentsAsync.data ?? [];
  const salesFor = (id: string) =>
    PAYMENTS.filter((p) => p.packageId === id && p.status === "successful").length;

  const filtered = PACKAGES.filter((pkg) => {
    if (filters.course !== "all" && pkg.courseSlug !== filters.course) return false;
    if (filters.duration !== "all" && pkg.duration !== filters.duration) return false;
    if (search && !pkg.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openCreate() {
    setEditing(null);
    setDraft({ ...EMPTY_DRAFT, courseSlug: COURSES[0]?.slug ?? "" });
    setFormOpen(true);
  }

  function openEdit(pkg: Package) {
    setEditing(pkg);
    setDraft({
      courseSlug: pkg.courseSlug,
      name: pkg.name,
      duration: pkg.duration,
      durationLabel: pkg.durationLabel,
      durationMonths: String(pkg.durationMonths),
      price: String(pkg.price),
      originalPrice: pkg.originalPrice ? String(pkg.originalPrice) : "",
      discountPercent: pkg.discountPercent ? String(pkg.discountPercent) : "",
      tier: pkg.tier ?? "",
      tests: String(pkg.tests),
      recommended: Boolean(pkg.recommended),
      status: pkg.status ?? "active",
      tagline: pkg.tagline ?? "",
      features: (pkg.features ?? []).join("\n"),
      benefits: (pkg.benefits ?? []).join("\n"),
      includes: {
        examAccess: pkg.includes?.examAccess ?? false,
        analytics: pkg.includes?.analytics ?? false,
        answerKey: pkg.includes?.answerKey ?? false,
        doubtSupport: pkg.includes?.doubtSupport ?? false,
        mentorship: pkg.includes?.mentorship ?? false,
        printedMaterial: pkg.includes?.printedMaterial ?? false,
      },
    });
    setFormOpen(true);
  }

  /**
   * Keep price / original price / discount % in step as the admin types:
   * enter the discount % and the selling price follows; enter the selling
   * price and the discount % follows. The field being edited always wins.
   * (The server re-derives the stored values from the same rule.)
   */
  function setPricing(field: "price" | "originalPrice" | "discountPercent", value: string) {
    setDraft((d) => {
      const next = { ...d, [field]: value };
      const original = Number(next.originalPrice);
      if (!(original > 0)) return { ...next, discountPercent: field === "discountPercent" ? value : "" };
      const fromPercent = () => {
        const pct = Math.min(100, Math.max(0, Number(next.discountPercent) || 0));
        return String(Math.round(original * (100 - pct)) / 100);
      };
      const fromPrice = () => {
        const price = Math.max(0, Number(next.price) || 0);
        return String(Math.max(0, Math.round(((original - price) / original) * 1000) / 10));
      };
      if (field === "discountPercent") return value === "" ? next : { ...next, price: fromPercent() };
      if (field === "price") return value === "" ? { ...next, discountPercent: "" } : { ...next, discountPercent: fromPrice() };
      // original price edited: keep the discount % if there is one, else derive it from the price
      return next.discountPercent !== "" ? { ...next, price: fromPercent() } : next.price !== "" ? { ...next, discountPercent: fromPrice() } : next;
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.courseSlug || !draft.name || !draft.durationMonths || !draft.price) {
      toast.error("Course, name, duration and price are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        courseSlug: draft.courseSlug,
        name: draft.name,
        duration: draft.duration,
        durationLabel: draft.durationLabel || draft.duration,
        durationMonths: Number(draft.durationMonths) || 0,
        price: Number(draft.price) || 0,
        originalPrice: draft.originalPrice ? Number(draft.originalPrice) : null,
        discountPercent: draft.discountPercent ? Number(draft.discountPercent) : 0,
        tier: draft.tier || null,
        tests: Number(draft.tests) || 0,
        recommended: draft.recommended,
        status: draft.status,
        tagline: draft.tagline || null,
        features: linesToList(draft.features),
        benefits: linesToList(draft.benefits),
        includes: draft.includes,
      };
      if (editing) {
        await adminService.updatePackage(editing.id, payload);
      } else {
        await adminService.createPackage(payload);
      }
      packagesAsync.reload();
      setFormOpen(false);
      setEditing(null);
      toast.success(editing ? "Package updated" : "Package created", {
        description: editing
          ? "Changes are live on the packages page immediately."
          : "The package is now available for students to purchase.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this package.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await adminService.deletePackage(deleteTarget.id);
      packagesAsync.reload();
      toast.success(`${deleteTarget.name} deleted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this package.");
    }
  }

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
        row.status === "inactive" ? (
          <Badge tone="neutral" size="sm">
            Inactive
          </Badge>
        ) : row.recommended ? (
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
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="secondary" size="xs">
            <Link to={`/packages/${row.id}`}>
              View
              <ArrowUpRight />
            </Link>
          </Button>
          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownLabel>{row.name}</DropdownLabel>
              <DropdownSeparator />
              <DropdownItem onSelect={() => openEdit(row)}>
                <Pencil />
                Edit package
              </DropdownItem>
              <DropdownItem destructive onSelect={() => setDeleteTarget(row)}>
                <Trash2 />
                Delete package
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
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
          <div className="flex flex-wrap gap-2">
          <Button size="md" onClick={openCreate}>
            <Plus />
            Add package
          </Button>
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
          </div>
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

      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add package"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Changes apply immediately, including on the public packages page."
                : "New packages appear on the public packages page once saved."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save}>
            <DialogBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <Field label="Package name" htmlFor="p-name" required>
                  <Input
                    id="p-name"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Class 11 Foundation — 6 Months"
                  />
                </Field>
                <Field label="Course" htmlFor="p-course" required>
                  <Select
                    id="p-course"
                    value={draft.courseSlug}
                    onChange={(e) => setDraft((d) => ({ ...d, courseSlug: e.target.value }))}
                  >
                    {COURSES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.shortName}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field
                label="Status"
                htmlFor="p-status"
                hint="Inactive packages disappear from the website and student portal and can no longer be purchased."
              >
                <Select
                  id="p-status"
                  value={draft.status}
                  onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </Field>

              <Field
                label="Plan (test schedule)"
                htmlFor="p-tier"
                hint="Links this package to that plan's test calendar. Students then only see the tests still to come."
              >
                <Select
                  id="p-tier"
                  value={draft.tier}
                  onChange={(e) => setDraft((d) => ({ ...d, tier: e.target.value }))}
                >
                  <option value="">No test calendar</option>
                  <option value="Basic">Basic</option>
                  <option value="Pro">Pro</option>
                  <option value="Pro Max">Pro Max</option>
                </Select>
              </Field>

              <Field label="Tagline" htmlFor="p-tagline">
                <Input
                  id="p-tagline"
                  value={draft.tagline}
                  onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
                  placeholder="A short one-line pitch shown on the package card"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="Duration" htmlFor="p-duration" required>
                  <Select
                    id="p-duration"
                    value={draft.duration}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, duration: e.target.value as Package["duration"] }))
                    }
                  >
                    <option value="3M">3 Months</option>
                    <option value="6M">6 Months</option>
                    <option value="1Y">1 Year</option>
                    <option value="2Y">2 Years</option>
                  </Select>
                </Field>
                <Field label="Duration label" htmlFor="p-durationLabel">
                  <Input
                    id="p-durationLabel"
                    value={draft.durationLabel}
                    onChange={(e) => setDraft((d) => ({ ...d, durationLabel: e.target.value }))}
                    placeholder="6 Months"
                  />
                </Field>
                <Field label="Months" htmlFor="p-months" required>
                  <Input
                    id="p-months"
                    type="number"
                    value={draft.durationMonths}
                    onChange={(e) => setDraft((d) => ({ ...d, durationMonths: e.target.value }))}
                  />
                </Field>
                <Field label="Tests" htmlFor="p-tests">
                  <Input
                    id="p-tests"
                    type="number"
                    value={draft.tests}
                    onChange={(e) => setDraft((d) => ({ ...d, tests: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Selling price (₹)" htmlFor="p-price" required hint="What the student pays (before GST).">
                  <Input
                    id="p-price"
                    type="number"
                    value={draft.price}
                    onChange={(e) => setPricing("price", e.target.value)}
                  />
                </Field>
                <Field label="Original price (₹)" htmlFor="p-originalPrice" hint="Shown struck through.">
                  <Input
                    id="p-originalPrice"
                    type="number"
                    value={draft.originalPrice}
                    onChange={(e) => setPricing("originalPrice", e.target.value)}
                  />
                </Field>
                <Field label="Discount %" htmlFor="p-discount" hint="Fills the selling price for you, or is worked out from it.">
                  <Input
                    id="p-discount"
                    type="number"
                    value={draft.discountPercent}
                    onChange={(e) => setPricing("discountPercent", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Features" htmlFor="p-features" hint="One per line">
                  <Textarea
                    id="p-features"
                    rows={4}
                    value={draft.features}
                    onChange={(e) => setDraft((d) => ({ ...d, features: e.target.value }))}
                    placeholder={"6 CBT examinations\nFull performance analytics"}
                  />
                </Field>
                <Field label="Benefits" htmlFor="p-benefits" hint="One per line">
                  <Textarea
                    id="p-benefits"
                    rows={4}
                    value={draft.benefits}
                    onChange={(e) => setDraft((d) => ({ ...d, benefits: e.target.value }))}
                    placeholder={"Experience the real CBT interface\nBaseline diagnostic of standing"}
                  />
                </Field>
              </div>

              <Field label="Includes">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {(
                    [
                      ["examAccess", "Exam access"],
                      ["analytics", "Performance analytics"],
                      ["answerKey", "Answer key"],
                      ["doubtSupport", "Doubt support"],
                      ["mentorship", "Mentorship"],
                      ["printedMaterial", "Printed material"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-ink-700">
                      <Checkbox
                        checked={draft.includes[key]}
                        onCheckedChange={(checked) =>
                          setDraft((d) => ({
                            ...d,
                            includes: { ...d.includes, [key]: checked === true },
                          }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </Field>

              <label className="flex items-center gap-2 text-sm text-ink-700">
                <Checkbox
                  checked={draft.recommended}
                  onCheckedChange={(checked) =>
                    setDraft((d) => ({ ...d, recommended: checked === true }))
                  }
                />
                Mark as recommended for this course
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? "Save changes" : "Add package"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name}?`}
        description="This removes the package permanently and it disappears from the public packages page immediately. Students who already purchased it keep their access."
        confirmLabel="Delete package"
        tone="danger"
        details={
          deleteTarget && (
            <div className="rounded-xl border border-ink-200 bg-canvas p-4 text-sm">
              <p className="font-semibold text-navy-900">{deleteTarget.name}</p>
              <p className="mt-1 text-ink-500">
                {deleteTarget.durationLabel} · {formatCurrency(deleteTarget.price)}
              </p>
            </div>
          )
        }
        onConfirm={confirmDelete}
      />
    </div>
  );
}
