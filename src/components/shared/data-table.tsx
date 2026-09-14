"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { EmptyState } from "./states";
import { TableSkeleton } from "./states";

export interface Column<T> {
  key: string;
  header: string;
  /** Cell renderer. Falls back to `row[key]`. */
  cell?: (row: T) => React.ReactNode;
  /** Value used for sorting; enables the sort control when provided. */
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right" | "center";
  /** Hide this column in the mobile card layout. */
  hideOnCard?: boolean;
  /** Promote to the card title on mobile. */
  primary?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  empty?: React.ReactNode;
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  /** Sticky first column on horizontal scroll. */
  stickyFirst?: boolean;
  caption?: string;
  className?: string;
  /** Renders a stacked card list below `md` instead of a scrolling table. */
  cardsOnMobile?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  empty,
  selectable,
  selected = [],
  onSelectedChange,
  onRowClick,
  stickyFirst,
  caption,
  className,
  cardsOnMobile = true,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return sort.dir === "asc" ? result : -result;
    });
    return copy;
  }, [rows, sort, columns]);

  const allIds = sorted.map(rowKey);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.includes(id));
  const someSelected = allIds.some((id) => selected.includes(id)) && !allSelected;

  function toggleAll() {
    if (!onSelectedChange) return;
    onSelectedChange(allSelected ? [] : allIds);
  }

  function toggleRow(id: string) {
    if (!onSelectedChange) return;
    onSelectedChange(
      selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id],
    );
  }

  function toggleSort(key: string) {
    setSort((prev) =>
      prev?.key === key
        ? prev.dir === "asc"
          ? { key, dir: "desc" }
          : null
        : { key, dir: "asc" },
    );
  }

  if (loading) return <TableSkeleton columns={Math.min(columns.length, 6)} />;

  if (!rows.length) {
    return (
      <>
        {empty ?? (
          <EmptyState title="Nothing to show yet" description="No records match this view." />
        )}
      </>
    );
  }

  const align = (a?: Column<T>["align"]) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  return (
    <div className={className}>
      {/* Desktop / tablet: scrolling table */}
      <div
        className={cn(
          "nv-scroll overflow-x-auto rounded-xl border border-ink-200 bg-white",
          cardsOnMobile && "hidden md:block",
        )}
      >
        <table className="w-full min-w-max border-collapse text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50/80">
              {selectable && (
                <th scope="col" className="w-10 px-4 py-3">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column, index) => {
                const sortable = Boolean(column.sortValue);
                const active = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-2xs font-bold uppercase tracking-wider text-ink-500",
                      align(column.align),
                      stickyFirst && index === 0 && !selectable && "sticky left-0 z-10 bg-ink-50",
                      column.headerClassName,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-navy-900"
                        aria-label={`Sort by ${column.header}`}
                      >
                        {column.header}
                        {active ? (
                          sort!.dir === "asc" ? (
                            <ChevronUp className="size-3.5 text-navy-800" />
                          ) : (
                            <ChevronDown className="size-3.5 text-navy-800" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3.5 text-ink-300" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {sorted.map((row) => {
              const id = rowKey(row);
              const isSelected = selected.includes(id);
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors",
                    isSelected ? "bg-royal-50/60" : "hover:bg-ink-50/70",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(id)}
                        aria-label={`Select row ${id}`}
                      />
                    </td>
                  )}
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={cn(
                        "whitespace-nowrap px-4 py-3.5 text-ink-700",
                        align(column.align),
                        stickyFirst &&
                          index === 0 &&
                          !selectable &&
                          "sticky left-0 z-10 bg-white font-medium",
                        column.className,
                      )}
                    >
                      {column.cell
                        ? column.cell(row)
                        : String((row as Record<string, unknown>)[column.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: responsive cards so wide admin tables never break the layout */}
      {cardsOnMobile && (
        <ul className="space-y-3 md:hidden">
          {sorted.map((row) => {
            const id = rowKey(row);
            const primary = columns.find((c) => c.primary) ?? columns[0];
            const rest = columns.filter((c) => c !== primary && !c.hideOnCard);
            return (
              <li key={id}>
                <div
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "rounded-xl border border-ink-200 bg-white p-4 shadow-xs",
                    onRowClick && "cursor-pointer active:bg-ink-50",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 font-semibold text-navy-900">
                      {primary.cell
                        ? primary.cell(row)
                        : String((row as Record<string, unknown>)[primary.key] ?? "")}
                    </div>
                    {selectable && (
                      <Checkbox
                        checked={selected.includes(id)}
                        onCheckedChange={() => toggleRow(id)}
                        aria-label={`Select ${id}`}
                      />
                    )}
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {rest.map((column) => (
                      <div key={column.key} className="min-w-0">
                        <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-400">
                          {column.header}
                        </dt>
                        <dd className="mt-0.5 truncate text-sm text-ink-700">
                          {column.cell
                            ? column.cell(row)
                            : String((row as Record<string, unknown>)[column.key] ?? "—")}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
