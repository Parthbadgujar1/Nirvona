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

/**
 * Parses the CSV this module itself writes (see toCSV/escapeCell): comma
 * header + rows, double-quoted cells for anything containing a comma,
 * quote or newline, doubled quotes as the escape. Handles a UTF-8 BOM
 * (downloadFile prepends one) and CRLF/LF line endings, since a person
 * may re-save the file in Excel before uploading it back.
 */
export function parseCSV(text: string): Record<string, string>[] {
  const clean = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  function parseLine(line: string): string[] {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells;
  }

  const lines = clean.split("\n").filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const header = parseLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row: Record<string, string> = {};
    header.forEach((key, i) => {
      row[key] = (cells[i] ?? "").trim();
    });
    return row;
  });
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
