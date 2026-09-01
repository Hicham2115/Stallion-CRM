/**
 * ============================================================================
 *  ANALYSIS CONFIGURATION
 * ============================================================================
 *  Copy, flags, KPI cards and table columns for /admin/analysis and
 *  /rep/analysis — the same screen, mounted under both roles (see
 *  config/navigation.js). Nothing user-facing is hard-coded in the JSX.
 *
 *  Quick answers to the usual requests:
 *    - Hide the ad-spend importer .... features.adSpendImport = false
 *    - Hide the "clear all" button ... features.clearAllSpend = false
 *    - Drop a KPI card ............... remove it from `kpis`
 *    - Drop a table column ........... remove it from campaignColumns /
 *                                      creativeColumns
 *    - Add a date range .............. push to `ranges`
 *    - Translate the screen .......... swap the `content` object
 *
 *  WHY THIS IS NOT PART OF config/reports.js. Reports answers "how is the
 *  pipeline doing" from /api/leads, computed client-side. Analysis answers
 *  "what did it cost and what did it earn" from /api/analytics/kpis, computed
 *  server-side by KpiService. Different data source, different audience
 *  (Reports is admin-only, Analysis is admin + sales), different screen.
 * ============================================================================
 */
import {
    Banknote,
    Coins,
    Gem,
    Percent,
    Receipt,
    Repeat,
    Scale,
    Wallet,
} from "lucide-react";

export const analysisConfig = {
    features: {
        // The Ad Spend tab. Turning this off leaves the Economics figures
        // visible but removes the only way to put spend behind them, so
        // every cost figure would go permanently "—".
        adSpendImport: true,
        // "Clear all ad spend". Destructive, behind a confirm dialog. It
        // exists because a CSV imported with the wrong campaign names still
        // counts toward total spend, so it inflates CAC while attributing to
        // nothing — see AdSpendController::destroyAll().
        clearAllSpend: true,
        campaignTable: true,
        creativeTable: true,
    },

    // Mirrors reportsConfig.ranges deliberately rather than importing it —
    // the two screens are free to diverge, and a shared array would make one
    // of them change silently when the other was edited.
    ranges: [
        { days: 7, label: "Last 7 days" },
        { days: 30, label: "Last 30 days" },
        { days: 90, label: "Last 90 days" },
        { days: 0, label: "All time" },
    ],
    defaultRangeDays: 30,

    /**
     * The economics cluster, in reading order: what a customer costs, what a
     * customer is worth, the ratio between them, then the money itself.
     *
     * `path` is read out of the /api/analytics/kpis payload. `scale` is
     * applied before formatting — gross_margin arrives as a RATIO (0.42) and
     * formatPercent expects whole percents (42), which is exactly the kind of
     * ×100 that goes wrong when it lives in a component.
     *
     * Every one of these can legitimately be null. KpiService returns null,
     * never 0, for a ratio whose denominator is unknown — the card renders an
     * em dash for it. See content.noData.
     */
    kpis: [
        {
            key: "cac",
            path: ["economics", "cac"],
            label: "Cost per Customer",
            icon: Coins,
            format: "currency",
            foot: "caption",
            caption: "Ad spend ÷ deals won",
        },
        {
            key: "cpl",
            path: ["acquisition", "cpl"],
            label: "Cost per Lead",
            icon: Receipt,
            format: "currency",
            foot: "caption",
            caption: "Ad spend ÷ leads in range",
        },
        {
            key: "ltv",
            path: ["economics", "ltv"],
            label: "Lifetime Value",
            icon: Gem,
            format: "currency",
            foot: "caption",
            caption: "Contract + recurring − delivery cost",
        },
        {
            key: "ltv_cac",
            path: ["economics", "ltv_cac"],
            label: "LTV : CAC",
            icon: Scale,
            format: "ratio",
            foot: "caption",
            caption: "Value returned per dirham spent",
        },
        {
            key: "revenue",
            path: ["economics", "revenue"],
            label: "Revenue",
            icon: Banknote,
            format: "currency",
            foot: "caption",
            caption: "Contract value of deals won",
        },
        {
            key: "gross_profit",
            path: ["economics", "gross_profit"],
            label: "Gross Profit",
            icon: Wallet,
            format: "currency",
            foot: "caption",
            caption: "Revenue − delivery cost",
        },
        {
            key: "gross_margin",
            path: ["economics", "gross_margin"],
            label: "Gross Margin",
            icon: Percent,
            format: "percent",
            // The API sends a 0-1 ratio; formatPercent takes whole percents.
            scale: 100,
            foot: "caption",
            caption: "Share of revenue kept",
        },
        {
            key: "mrr",
            path: ["economics", "mrr"],
            label: "MRR",
            icon: Repeat,
            format: "currency",
            foot: "caption",
            caption: "Recurring, across won clients",
        },
    ],

    /**
     * `campaigns` rows from the API. `identity: true` marks the column that
     * stays pinned while the rest scrolls — on a wide table the row's name is
     * the one thing that must never leave the screen.
     */
    campaignColumns: [
        { key: "campaign", label: "Campaign", identity: true, width: "w-[16rem]" },
        { key: "leads", label: "Leads", numeric: true, format: "number" },
        { key: "spend", label: "Spend", numeric: true, format: "currency" },
        { key: "cpl", label: "CPL", numeric: true, format: "currency" },
        { key: "consults", label: "Consults", numeric: true, format: "number", hideBelow: "lg" },
        { key: "won", label: "Won", numeric: true, format: "number" },
        { key: "revenue", label: "Revenue", numeric: true, format: "currency", hideBelow: "md" },
    ],

    creativeColumns: [
        { key: "creative", label: "Creative", identity: true, width: "w-[16rem]" },
        { key: "ad_set", label: "Ad set", hideBelow: "lg" },
        { key: "campaign", label: "Campaign", hideBelow: "xl" },
        { key: "leads", label: "Leads", numeric: true, format: "number" },
        { key: "spend", label: "Spend", numeric: true, format: "currency" },
        { key: "cpl", label: "CPL", numeric: true, format: "currency" },
        { key: "won", label: "Won", numeric: true, format: "number" },
        { key: "revenue", label: "Revenue", numeric: true, format: "currency", hideBelow: "md" },
    ],

    spendColumns: [
        { key: "date", label: "Date", width: "w-[8rem]" },
        { key: "campaign", label: "Campaign" },
        { key: "ad_set", label: "Ad set", hideBelow: "lg" },
        { key: "creative", label: "Creative", hideBelow: "xl" },
        { key: "spend", label: "Spend", numeric: true, width: "w-[9rem]" },
        { key: "actions", label: "Actions", srOnly: true, width: "w-[4rem]" },
    ],

    /** Accepted upload types and size, kept in step with AdSpendController's
     *  `mimes:csv,txt|max:5120` rule so the browser rejects a bad file before
     *  it costs a round trip. Changing one without the other just moves where
     *  the error appears. */
    upload: {
        accept: ".csv,text/csv",
        maxBytes: 5 * 1024 * 1024,
    },

    content: {
        rangeLabel: "Date range",

        economicsTab: "Economics",
        adSpendTab: "Ad Spend",

        /** Every figure the API returned as null renders as this. A real zero
         *  and "we do not know" must never look the same. */
        noData: "—",
        noDataSr: "Not enough data yet",

        loadErrorTitle: "Could not load the figures",

        campaignTitle: "Campaign Performance",
        campaignHint: "Cost and return, by campaign",
        campaignCaption: "Campaigns ranked by number of leads, with spend, cost per lead and revenue",
        emptyCampaigns: "No campaign-tagged leads in this range",

        creativeTitle: "Creative Performance",
        creativeHint: "Cost and return, by ad",
        creativeCaption: "Creatives ranked by number of leads, with spend, cost per lead and revenue",
        emptyCreatives: "No creative-tagged leads in this range",

        /* The single most-asked question about this screen, answered on the
           screen rather than in a support message. A blank spend column is
           almost always a naming mismatch, not a missing import. */
        attributionNote:
            "Spend only lands on a row whose name matches an imported ad-spend row exactly. A blank Spend or CPL means no imported row carries that name — check the campaign, ad set and ad names in your export against the UTM values on your ad links.",

        /* Surfaced verbatim from economics.ltv_note when LTV is null, so the
           reason a card is empty is on screen instead of in a config file. */
        ltvNoteLabel: "Why is LTV empty?",

        spendTitle: "Imported Ad Spend",
        spendHint: "What the cost figures are built on",
        spendCaption: "Imported ad spend rows, newest first, with the amount spent per day and ad",
        uploadTitle: "Import Ad Spend",
        uploadHint: "Meta Ads Manager CSV export",
        uploadHelp:
            "Export from Ads Manager with Day as the breakdown, and campaign name, ad set name, ad name and amount spent as columns. Column names and order do not need to match exactly.",
        fileLabel: "CSV file",
        uploadSubmitLabel: "Import",
        uploadPendingLabel: "Importing…",
        fileTooLarge: "That file is larger than 5 MB. Export a narrower date range.",
        fileWrongType: "That is not a CSV. Export from Ads Manager as CSV.",
        importToast: "Imported {imported} rows",
        importToastDetail: "{skipped} skipped",
        importToastClean: "Nothing was skipped",
        importedNothing: "No rows were imported",
        importErrorsTitle: "Rows that were skipped",
        reimportNote:
            "Re-importing the same export is safe: a row for the same day, campaign, ad set and ad is overwritten, never added twice.",

        spendLimitNote: "Showing the latest {limit} of {total} rows.",
        emptySpend: "No ad spend imported yet",

        deleteRowLabel: "Delete row",
        deleteRowTitle: "Delete this spend row?",
        deleteRowDescription:
            "The amount stops counting toward CAC, cost per lead and this campaign's spend. Re-importing the export brings it back.",
        deleteRowConfirmLabel: "Delete row",
        deleteRowToast: "Deleted 1 spend row",

        clearAllLabel: "Clear all",
        clearAllTitle: "Delete every ad spend row?",
        clearAllDescription:
            "Every imported row goes, for every date and campaign. CAC, cost per lead and all campaign spend go back to “—” until something is imported again. This cannot be undone.",
        clearAllConfirmLabel: "Delete everything",
        clearAllRecord: "{n} imported rows",
        clearAllToast: "Deleted {n} spend rows",
    },
};

/** Look up a range by its day count. Falls back to the default rather than
 *  returning undefined, so a stale value cannot blank the screen. */
export function findAnalysisRange(days) {
    return (
        analysisConfig.ranges.find((range) => range.days === days) ??
        analysisConfig.ranges.find((range) => range.days === analysisConfig.defaultRangeDays) ??
        analysisConfig.ranges[0]
    );
}

/**
 * A range in days => the `date_from` / `date_to` the API takes.
 *
 * "All time" (0 days) sends NEITHER param rather than a very old date:
 * KpiService applies a date clause only when the filter is present, and an
 * invented lower bound would quietly exclude anything older than it.
 */
export function rangeParams(days) {
    if (days <= 0) return {};

    const to = new Date();
    const from = new Date(to.getTime() - days * 86_400_000);
    const iso = (date) => date.toISOString().slice(0, 10);

    return { date_from: iso(from), date_to: iso(to) };
}
