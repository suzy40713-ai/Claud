/** RFC 4180 CSV with protection against spreadsheet formula injection. */
export function csvCell(value: unknown): string {
  let s = value == null ? "" : Array.isArray(value) ? value.join(" | ") : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  // BOM so Excel opens UTF-8 accents correctly.
  return "﻿" + [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}
