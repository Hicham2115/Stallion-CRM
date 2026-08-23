/**
 * ============================================================================
 *  REPORTS CONFIGURATION
 * ============================================================================
 *  Date ranges, KPI cards, copy and feature flags for /admin/reports.
 *
 *  Quick answers to the usual requests:
 *    - Add a date range .............. push a ReportRange
 *    - Change the default range ...... defaultRangeDays
 *    - Drop a KPI card ............... remove it from `kpis`
 *    - Hide a panel .................. features.<panel> = false
 *    - Turn off the delta chips ...... features.periodDeltas = false
 *    - Rename an export file ......... content.csvFilePrefix
 * ============================================================================
 */

import { Coins, TrendingUp, UserCheck, Users } from "lucide-react";

import type { KpiDefinition } from "@/config/admin";

/**
 * Which computed figure a Reports KPI card shows.
 *
 * Three of these are the dashboard's figures recomputed over the selected date
 * range; `revenue` is specific to this screen. All four are derived in
 * lib/store/selectors.ts — none is stored.
 *
 * NOTE the absence of `avgDialsPerRep`, which the dashboard does show. Reps
 * carry running dial totals rather than dated call records, so there is no
 * honest way to say how many dials happened inside a 30-day window. Putting an
 * all-time figure under a date-range control would be a lie the control makes
 * you believe, so the card is simply not on this screen — the Dials per Rep
 * panel below covers rep activity, and says plainly that it is all-time.
 *
 * TODO(backend): once calls are dated records, add the key back here and range
 * it like the others.
 */
export type ReportKpiKey =
  | "totalClients"
  | "conversionRate"
  | "attendingRate"
  | "revenue";

export interface ReportRange {
  /** Days back from today. 0 means all time. */
  days: number;
  label: string;
  /** Fills `{range}` in the delta tooltip, e.g. "the previous 30 days". */
  comparisonLabel: string;
}

export interface ReportsFeatureFlags {
  /** Export CSV / Export PDF in the toolbar. */
  exports: boolean;
  /** Period-over-period chips on the KPI cards. Off for the all-time range
   *  regardless, since there is no preceding period to compare against. */
  periodDeltas: boolean;
  /** Lead source breakdown panel. */
  sourceBreakdown: boolean;
  /** Dials per rep panel. */
  dialsPerRep: boolean;
  /**
   * Adds conversions-per-100-dials to the Dials per Rep rows.
   *
   * Without it this panel shows the same ranking as the dashboard leaderboard,
   * one screen apart. With it, the panel answers who is EFFECTIVE rather than
   * who is loud — which is the question an analysis screen exists for. Set
   * false to stay literal to the prototype.
   */
  repEfficiency: boolean;
}

export interface ReportsConfig {
  features: ReportsFeatureFlags;
  ranges: ReportRange[];
  /** Must match one of `ranges[].days`. */
  defaultRangeDays: number;
  kpis: KpiDefinition<ReportKpiKey>[];
  content: {
    /** The dials table's visually-hidden `<caption>`. */
    dialsTableCaption: string;
    rangeLabel: string;
    exportCsvLabel: string;
    exportPdfLabel: string;
    exportCsvHint: string;
    exportPdfHint: string;
    csvFilePrefix: string;
    /** Export confirmation. `{n}` is the number of rows written. */
    exportToast: string;
    /** Second line of the export toast. `{range}` is the active range. */
    exportToastDetail: string;
    /** Screen-reader caption for the source table. */
    sourcesCaption: string;
    sourceTitle: string;
    sourceHint: string;
    dialsTitle: string;
    dialsHint: string;
    /** Tooltip on the conversions-per-dial figure. */
    efficiencyTooltip: string;
    /** Tooltip on the KPI delta chips. `{range}` is the comparison label. */
    deltaTooltip: string;
    emptyTitle: string;
    emptyDescription: string;
    emptySourceTitle: string;
    emptyDialsTitle: string;
    /** Sits under the whole screen, naming what the figures are drawn from. */
    rangeFootnote: string;
  };
}

export const reportsConfig: ReportsConfig = {
  features: {
    exports: true,
    periodDeltas: true,
    sourceBreakdown: true,
    dialsPerRep: true,
    repEfficiency: true,
  },

  ranges: [
    { days: 7, label: "Last 7 days", comparisonLabel: "the previous 7 days" },
    { days: 30, label: "Last 30 days", comparisonLabel: "the previous 30 days" },
    { days: 90, label: "Last 90 days", comparisonLabel: "the previous 90 days" },
    { days: 0, label: "All time", comparisonLabel: "" },
  ],

  defaultRangeDays: 30,

  kpis: [
    {
      key: "totalClients",
      label: "Clients Won",
      icon: Users,
      format: "number",
      foot: "caption",
      caption: "from {n} leads in range",
    },
    {
      key: "conversionRate",
      label: "Conversion Rate",
      icon: TrendingUp,
      format: "percent",
      foot: "progress",
      target: 100,
    },
    {
      key: "attendingRate",
      label: "Attending Rate",
      icon: UserCheck,
      format: "percent",
      foot: "progress",
      target: 100,
    },
    {
      key: "revenue",
      label: "Billed Revenue",
      icon: Coins,
      format: "currency",
      foot: "caption",
      // The prototype printed "453229 MAD" with no explanation of what it
      // summed. A money figure nobody can define is worse than none, so the
      // card says so on its face.
      caption: "all invoices on {n} clients",
    },
  ],

  content: {
    dialsTableCaption:
      "Sales reps ranked by dials, with conversions per 100 dials",
    rangeLabel: "Date range",
    exportCsvLabel: "Export CSV",
    exportPdfLabel: "Export PDF",
    exportCsvHint: "Download the leads in this range as a spreadsheet",
    exportPdfHint: "Open the print dialog — choose 'Save as PDF'",
    csvFilePrefix: "stallion-report",
    exportToast: "Exported {n} leads",
    exportToastDetail: "{range} · CSV",
    sourcesCaption: "Lead sources, ranked by number of leads",
    sourceTitle: "Lead Sources",
    sourceHint: "Share of leads in range",
    dialsTitle: "Dials per Rep",
    dialsHint: "All-time totals · conversion rate",
    efficiencyTooltip: "Conversions per 100 dials",
    deltaTooltip: "Compared with {range}",
    emptyTitle: "No leads in this range",
    emptyDescription:
      "Nothing was created in the selected period. Widen the date range to see earlier activity.",
    emptySourceTitle: "No sources to show",
    emptyDialsTitle: "No active reps yet",
    rangeFootnote:
      "Figures cover leads created in the selected range. Rep dial totals are all-time.",
  },
};

/** Look up a range by its day count. Falls back to the default rather than
 *  returning undefined, so a stale value from a URL cannot blank the screen. */
export function findRange(days: number): ReportRange {
  return (
    reportsConfig.ranges.find((range) => range.days === days) ??
    reportsConfig.ranges.find(
      (range) => range.days === reportsConfig.defaultRangeDays,
    ) ??
    reportsConfig.ranges[0]
  );
}
