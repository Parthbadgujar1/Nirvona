"use client";

import * as React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  className,
  id = "search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <Input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        leading={<Search />}
        trailing={
          value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded p-0.5 text-ink-400 transition-colors hover:text-navy-900"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          ) : undefined
        }
      />
    </div>
  );
}

export interface FilterDef {
  id: string;
  label: string;
  options: { label: string; value: string }[];
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  values,
  onChange,
  onReset,
  children,
  resultCount,
  className,
}: {
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onReset?: () => void;
  children?: React.ReactNode;
  resultCount?: number;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const activeCount = Object.entries(values).filter(([, v]) => v && v !== "all").length;

  return (
    <div className={cn("rounded-xl border border-ink-200 bg-white p-3 sm:p-4", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {onSearchChange && (
          <SearchBar
            value={search ?? ""}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="lg:max-w-xs"
          />
        )}

        <div className="flex items-center gap-2 lg:hidden">
          <Button variant="secondary" size="md" onClick={() => setOpen((o) => !o)} className="flex-1">
            <SlidersHorizontal />
            Filters
            {activeCount > 0 && (
              <Badge tone="ember" size="sm">
                {activeCount}
              </Badge>
            )}
          </Button>
        </div>

        <div
          className={cn(
            "flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex lg:flex-1 lg:items-center",
            open ? "flex" : "hidden lg:flex",
          )}
        >
          {filters.map((filter) => (
            <div key={filter.id} className="min-w-0 sm:w-auto lg:w-40">
              <label htmlFor={`filter-${filter.id}`} className="sr-only">
                {filter.label}
              </label>
              <Select
                id={`filter-${filter.id}`}
                value={values[filter.id] ?? "all"}
                onChange={(e) => onChange(filter.id, e.target.value)}
                className="h-10"
              >
                <option value="all">{filter.label}: All</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {filter.label}: {option.label}
                  </option>
                ))}
              </Select>
            </div>
          ))}
          {activeCount > 0 && onReset && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X />
              Clear
            </Button>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {resultCount !== undefined && (
              <span className="text-xs font-medium text-ink-500">
                {resultCount.toLocaleString("en-IN")} result{resultCount === 1 ? "" : "s"}
              </span>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const window: number[] = [];
  const start = Math.max(1, Math.min(page - 1, pages - 2));
  for (let i = start; i < start + 3 && i <= pages; i += 1) window.push(i);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
    >
      <p className="text-xs text-ink-500">
        Showing <span className="font-semibold text-navy-900">{from}</span>–
        <span className="font-semibold text-navy-900">{to}</span> of{" "}
        <span className="font-semibold text-navy-900">{total.toLocaleString("en-IN")}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        {window.map((p) => (
          <Button
            key={p}
            variant={p === page ? "navy" : "ghost"}
            size="icon-sm"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Button>
        ))}
        {pages > 3 && start + 3 <= pages && <span className="px-1 text-ink-400">…</span>}
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
