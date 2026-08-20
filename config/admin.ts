/**
 * ============================================================================
 *  ADMIN SCREENS CONFIGURATION
 * ============================================================================
 *  Copy, feature flags and column definitions for the admin screens. Nothing
 *  user-facing is hard-coded in the JSX.
 *
 *  Quick answers to the usual requests:
 *    - Hide a dashboard widget ........ dashboard.features.<widget> = false
 *    - Reword a KPI ................... dashboard.kpis[n].label
 *    - Change a KPI target ............ dashboard.kpis[n].target
 *    - Change currency / number format  locale + currency below
 *    - Translate a screen ............. swap the `content` objects
 * ============================================================================
 */

import {
  PhoneCall,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Which computed figure a KPI card shows.
 *
 * These are keys into the object returned by `selectKpis()` in
 * lib/store/selectors.ts, where each one is derived from the leads and reps —
 * none of them is a stored number. That file is worth reading before you wire
 * the backend: it documents the exact formula the API should reproduce.
 */
export type KpiKey =
  | "totalClients"
  | "attendingRate"
  | "conversionRate"
  | "avgDialsPerRep";

/**
 * What fills the bottom of a KPI card.
 *
 * Every card gets one. In the prototype two cards had progress bars, one had a
 * caption and one had nothing at all, which left a visible hole in the row and
 * made four cards that should read as one instrument look unrelated.
 */
export type KpiFoot =
  /** Progress toward `target`, as a bar. */
  | "progress"
  /** A small trend line built from the last N daily readings. */
  | "sparkline"
  /** A line of supporting text, e.g. "of 80 total leads". */
  | "caption";

/**
 * How a KPI figure is rendered.
 *   number    plain integer with thousands separators
 *   percent   appends %
 *   currency  compact in the card ("453.2K MAD"), exact figure on hover
 */
export type KpiFormat = "number" | "percent" | "currency";

/**
 * One KPI card.
 *
 * Generic over its key so the Reports screen can declare its own metric set
 * (config/reports.ts) while reusing this shape and the `KpiCard` component. The
 * dashboard's four keys stay the default, so nothing that already existed had
 * to change.
 */
export interface KpiDefinition<Key extends string = KpiKey> {
  key: Key;
  label: string;
  icon: LucideIcon;
  format: KpiFormat;
  foot: KpiFoot;
  /** Required when foot is "progress" — the 100% mark for the bar. For a
   *  percentage KPI this is a percentage; for a count it is a count. */
  target?: number;
  /** Required when foot is "caption". `{n}` is replaced with the supporting
   *  figure the selector provides (e.g. total leads). */
  caption?: string;
}

export interface DashboardFeatureFlags {
  /** The four-card instrument cluster at the top. */
  kpiCluster: boolean;
  /** The hairline tick ruler tying the KPI cards together. Pure chrome. */
  clusterRuler: boolean;
  /** Pipeline Breakdown bar chart. */
  pipelineBreakdown: boolean;
  /** Client Status list on the right. */
  clientStatus: boolean;
  /**
   * Adds the stage-to-stage conversion figure to each Client Status row
   * (e.g. New 20 -> Contacted 16 shows 80%).
   *
   * Without it, Client Status and Pipeline Breakdown show the same six numbers
   * twice. With it, the bars carry volume and the list carries drop-off, so
   * each panel earns its place. Nothing is invented — it is arithmetic on
   * figures already on screen. Set false to stay literal to the prototype.
   */
  stageConversion: boolean;
  /** Rep Leaderboard table. */
  repLeaderboard: boolean;
}

export interface LeaderboardColumn {
  /** Key into the rep record. */
  key: "dials" | "appointments" | "conversions";
  label: string;
}

export interface AdminConfig {
  /**
   * Locale and currency for every formatted figure.
   *
   * Passed explicitly to Intl everywhere (see lib/format.ts) rather than
   * relying on the ambient system locale — the server and the browser can have
   * different locales, and that renders different strings for the same number,
   * which React reports as a hydration mismatch.
   */
  locale: string;
  currency: string;

  dashboard: {
    features: DashboardFeatureFlags;
    kpis: KpiDefinition[];
    content: {
      /** `{firstName}` is replaced with the signed-in user's first name. */
      greeting: string;
      pipelineBreakdownTitle: string;
      pipelineBreakdownHint: string;
      clientStatusTitle: string;
      clientStatusHint: string;
      /** Shown instead of clientStatusHint when features.stageConversion is on. */
      clientStatusConversionHint: string;
      leaderboardTitle: string;
      leaderboardHint: string;
      /** Column header above the rep name. */
      repColumnLabel: string;
      /** Panel hint. `{metric}` is the active column, lowercased. */
      leaderboardRankedBy: string;
      /** Screen-reader table caption. `{metric}` is the active column. */
      leaderboardCaption: string;
      /** Tooltip on the conversion figure, explaining what it divides. */
      conversionTooltip: string;
      emptyLeaderboard: string;
      /** Accessible name for the KPI card group. */
      kpiClusterLabel: string;
      emptyPipeline: string;
    };
    leaderboardColumns: LeaderboardColumn[];
    /** Rows shown before "show all". 0 shows every rep. */
    leaderboardLimit: number;
  };
}

export const adminConfig: AdminConfig = {
  locale: "en-MA",
  currency: "MAD",

  dashboard: {
    features: {
      kpiCluster: true,
      clusterRuler: true,
      pipelineBreakdown: true,
      clientStatus: true,
      stageConversion: true,
      repLeaderboard: true,
    },

    kpis: [
      {
        key: "totalClients",
        label: "Total Clients",
        icon: Users,
        format: "number",
        foot: "caption",
        caption: "of {n} total leads",
      },
      {
        key: "attendingRate",
        label: "Attending Rate",
        icon: PhoneCall,
        format: "percent",
        foot: "progress",
        target: 100,
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
        key: "avgDialsPerRep",
        label: "Avg Dials / Rep",
        icon: Target,
        format: "number",
        // The prototype left this card's lower half empty. A seven-day trend
        // fills it with something worth knowing rather than padding.
        foot: "sparkline",
      },
    ],

    content: {
      greeting: "Hello, {firstName}",
      pipelineBreakdownTitle: "Pipeline Breakdown",
      pipelineBreakdownHint: "Leads by stage",
      clientStatusTitle: "Client Status",
      clientStatusHint: "Share of all leads",
      /** Used instead of clientStatusHint when features.stageConversion is on.
       *  Kept short — a mono uppercase micro-label that wraps to two lines
       *  stops being a label and starts being a paragraph. */
      clientStatusConversionHint: "Volume · stage conversion",
      leaderboardTitle: "Rep Leaderboard",
      leaderboardHint: "Ranked by dials",
      repColumnLabel: "Rep",
      leaderboardRankedBy: "Ranked by {metric}",
      leaderboardCaption: "Sales reps ranked by {metric}",
      conversionTooltip: "Share of the previous stage that reached this one",
      emptyLeaderboard: "No reps yet. Add one from Settings.",
      kpiClusterLabel: "Key performance indicators",
      emptyPipeline: "No leads yet.",
    },

    leaderboardColumns: [
      { key: "dials", label: "Dials" },
      { key: "appointments", label: "Appointments" },
      { key: "conversions", label: "Conversions" },
    ],

    leaderboardLimit: 0,
  },
};
