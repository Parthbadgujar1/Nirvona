/**
 * Client-side CSV/Excel export helpers.
 * A real deployment would stream XLSX from the API; for the prototype we build
 * an Excel-compatible CSV in the browser so every export button truly works.
 */

export type ExportColumn<T> = {
  key: keyof T | string;
  header: string;
  value?: (row: T) => string | number;
};

function escapeCell(input: string | number | null | undefined) {
  const value = input === null || input === undefined ? "" : String(input);
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function toCSV<T extends Record<string, unknown>>(rows: T[], columns: ExportColumn<T>[]) {
  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => escapeCell(c.value ? c.value(row) : (row[c.key as keyof T] as string)))
        .join(","),
    )
    .join("\n");
  return `${header}\n${body}`;
}

export function downloadFile(filename: string, content: string, mime = "text/csv;charset=utf-8;") {
  if (typeof window === "undefined") return;
  const blob = new Blob([`﻿${content}`], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportRows<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columns: ExportColumn<T>[],
) {
  downloadFile(filename, toCSV(rows, columns), "application/vnd.ms-excel;charset=utf-8;");
}

export function timestampedName(prefix: string, ext = "csv") {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  return `${prefix}_${stamp}.${ext}`;
}
