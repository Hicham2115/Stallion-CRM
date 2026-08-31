"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { reportsConfig } from "@/config/reports";
const { content, features, ranges } = reportsConfig;
// Styled Select, not a native <select> (Base UI's is keyboard-complete: type-
// ahead, arrows, Home/End, Esc). See lib/export.ts for why there's no PDF
// library and what window.print() gets us instead.
export function ReportToolbar({ rangeDays, onRangeChange, onExportCsv,
/** Number of rows the CSV would contain — disables the button at zero. */
exportCount, }) {
    return (<div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <label htmlFor="report-range" className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
          {content.rangeLabel}
        </label>

        <Select value={rangeDays} onValueChange={(value) => onRangeChange(value)}>
          <SelectTrigger id="report-range" size="default" className="h-10 min-w-[10.5rem] rounded-md border-hairline bg-white/[0.03] text-[0.875rem] text-ink hover:bg-white/[0.06]">
            <SelectValue />
          </SelectTrigger>

          <SelectContent className="border border-hairline bg-deck-card">
            {ranges.map((range) => (<SelectItem key={range.days} value={range.days} className="text-[0.875rem]">
                {range.label}
              </SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {features.exports && (
        <div className="flex items-center gap-2" data-print="hide">
          <Button variant="outline" size="lg" onClick={onExportCsv} disabled={exportCount === 0} title={content.exportCsvHint} className="h-10 rounded-md">
            <Download aria-hidden/>
            {content.exportCsvLabel}
          </Button>
        </div>)}
    </div>);
}
