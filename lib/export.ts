/**
 * ============================================================================
 *  CSV EXPORT
 * ============================================================================
 *  Turns rows into a CSV file the browser downloads. No library — this is
 *  string joining and one Blob, and a dependency for it would be larger than
 *  the code it replaced.
 *
 *  Its companion is `window.print()`, which is what the "Export PDF" button
 *  calls; the print stylesheet at the bottom of app/globals.css is what makes
 *  the result readable. Both exports are REAL. In the prototype neither button
 *  did anything, which is the worst state for a control to be in: it looks
 *  finished, so nobody reports it, and it is discovered by the one person who
 *  needed the file.
 *
 *  CLIENT-SIDE ONLY. Every one of these functions touches `document` or
 *  `URL`, so they must be called from an event handler, never during render.
 * ============================================================================
 */

/**
 * Escape one CSV field.
 *
 * The quoting rules are not optional here. Company names contain commas
 * ("Agadir Surf Co, SARL"), notes contain quotes and newlines, and any one of
 * them silently shifts every following column into the wrong place — a
 * corruption that looks like valid data when the file is opened.
 *
 * A field is quoted whenever it contains a comma, a quote, or a line break,
 * and embedded quotes are doubled, per RFC 4180.
 */
function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";

  const text = String(value);
  if (!/[",\r\n]/.test(text)) return text;

  return `"${text.replace(/"/g, '""')}"`;
}

/** Join rows into an RFC 4180 CSV document. */
export function toCsv(headers: string[], rows: Array<Array<string | number>>): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\r\n");
}

/**
 * Hand the browser a file to save.
 *
 * The object URL is revoked on the next frame rather than immediately: Safari
 * needs the URL to still resolve when it processes the synthetic click, and
 * revoking in the same tick produces a download that silently does nothing.
 */
export function downloadFile(
  filename: string,
  contents: string,
  mimeType = "text/csv;charset=utf-8",
): void {
  // The UTF-8 BOM is here for Excel, which otherwise reads the file as the
  // system codepage and renders "Chefchaouen" and every accented rep name as
  // mojibake. Costs three bytes; saves the recipient a support ticket.
  const blob = new Blob(["﻿", contents], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();

  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

/** Build the CSV and download it in one call. */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
): void {
  downloadFile(filename, toCsv(headers, rows));
}

/**
 * A filename stamped with today's date, e.g. "stallion-leads-2026-08-19.csv".
 *
 * Safe to call from a handler — never during render, where a date would differ
 * between the server and the client and trip a hydration mismatch. ISO order so
 * the files sort chronologically in a folder listing.
 */
export function stampedFilename(prefix: string, extension = "csv"): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  return `${prefix}-${stamp}.${extension}`;
}
