"use client";

import { Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reportsConfig } from "@/config/reports";

const { content, features, ranges } = reportsConfig;

/**
 * The Reports control bar: date range, and the two exports.
 *
 * THE SELECT IS A STYLED ONE, not a native `<select>`. The prototype used the
 * browser default, which on Windows paints a light-grey control with a system
 * blue highlight — the one element on the screen that ignores the entire
 * design. Base UI's Select is keyboard-complete (type-ahead, arrows, Home/End,
 * Esc) so nothing is lost by replacing it.
 *
 * BOTH EXPORTS DO SOMETHING REAL. See lib/export.ts for why there is no PDF
 * library and what `window.print()` gets us instead.
 */
export function ReportToolbar({
  rangeDays,
  onRangeChange,
  onExportCsv,
  /** Number of rows the CSV would contain — disables the button at zero. */
  exportCount,
}: {
  rangeDays: number;
  onRangeChange: (days: number) => void;
  onExportCsv: () => void;
  exportCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <label
          htmlFor="report-range"
          className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted"
        >
          {content.rangeLabel}
        </label>

        <Select
          // Base UI's Select carries a typed value rather than a string, so the
          // day count travels as a number and no parsing is needed on the way
          // back out.
          value={rangeDays}
          onValueChange={(value) => onRangeChange(value as number)}
        >
          <SelectTrigger
            id="report-range"
            size="default"
            className="h-10 min-w-[10.5rem] rounded-xl border-hairline bg-white/[0.03] text-[0.875rem] text-ink hover:bg-white/[0.06]"
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent className="border border-hairline bg-deck-card">
            {ranges.map((range) => (
              <SelectItem key={range.days} value={range.days} className="text-[0.875rem]">
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {features.exports && (
        // Hidden in print output: a printed page cannot be clicked, and the
        // buttons would sit in the PDF looking like part of the report.
        <div className="flex items-center gap-2" data-print="hide">
          <Button
            variant="outline"
            size="lg"
            onClick={onExportCsv}
            disabled={exportCount === 0}
            title={content.exportCsvHint}
            className="h-10 rounded-xl"
          >
            <Download aria-hidden />
            {content.exportCsvLabel}
          </Button>

          <Button
            variant="outline"
            size="lg"
            // Deliberately not wrapped in anything: the browser's own print
            // pipeline is the PDF writer, and the print stylesheet at the
            // bottom of app/globals.css inverts the console to ink-on-paper
            // before it runs.
            onClick={() => window.print()}
            title={content.exportPdfHint}
            className="h-10 rounded-xl"
          >
            <Printer aria-hidden />
            {content.exportPdfLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
