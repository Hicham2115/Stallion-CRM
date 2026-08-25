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
import { PhoneCall, Target, TrendingUp, Users, } from "lucide-react";
export const adminConfig = {
    routes: {
        home: "/admin",
        clients: "/admin/clients",
        client: (leadId) => `/admin/clients/${leadId}`,
        pipeline: "/admin/pipeline",
        chat: "/admin/chat",
        reports: "/admin/reports",
        settings: "/admin/settings",
    },
    locale: "en-GB",
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
