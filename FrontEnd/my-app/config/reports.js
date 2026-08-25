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
export const reportsConfig = {
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
        dialsTableCaption: "Sales reps ranked by dials, with conversions per 100 dials",
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
        emptyDescription: "Nothing was created in the selected period. Widen the date range to see earlier activity.",
        emptySourceTitle: "No sources to show",
        emptyDialsTitle: "No active reps yet",
        rangeFootnote: "Figures cover leads created in the selected range. Rep dial totals are all-time.",
    },
};
/** Look up a range by its day count. Falls back to the default rather than
 *  returning undefined, so a stale value from a URL cannot blank the screen. */
export function findRange(days) {
    return (reportsConfig.ranges.find((range) => range.days === days) ??
        reportsConfig.ranges.find((range) => range.days === reportsConfig.defaultRangeDays) ??
        reportsConfig.ranges[0]);
}
