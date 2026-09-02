"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { analysisConfig } from "@/config/analysis";
const { content, ranges } = analysisConfig;
/**
 * The date range for everything on the Economics tab.
 *
 * Deliberately not components/admin/reports/report-toolbar.jsx: that one
 * carries a "Export CSV" action bound to the leads list, which this screen
 * has nothing to do with. Sharing it would have meant threading an export
 * handler this screen does not own through a component to hide a button.
 */
export function AnalysisToolbar({ rangeDays, onRangeChange }) {
    return (<div className="flex flex-wrap items-center gap-2.5">
      <label htmlFor="analysis-range" className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
        {content.rangeLabel}
      </label>

      <Select value={rangeDays} onValueChange={(value) => onRangeChange(value)}>
        <SelectTrigger id="analysis-range" size="default" className="h-10 min-w-[10.5rem] rounded-md border-hairline bg-white/[0.03] text-[0.875rem] text-ink hover:bg-white/[0.06]">
          <SelectValue />
        </SelectTrigger>

        <SelectContent className="border border-hairline bg-deck-card">
          {ranges.map((range) => (<SelectItem key={range.days} value={range.days} className="text-[0.875rem]">
              {range.label}
            </SelectItem>))}
        </SelectContent>
      </Select>
    </div>);
}
