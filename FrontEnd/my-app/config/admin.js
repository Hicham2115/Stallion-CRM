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
import { CalendarClock, CircleDollarSign, HandCoins, PackageCheck, PhoneCall, PiggyBank, TrendingUp, UserCheck2, Users, } from "lucide-react";
export const adminConfig = {
    routes: {
        home: "/admin",
        clients: "/admin/clients",
        pipeline: "/admin/pipeline",
        chat: "/admin/chat",
        analysis: "/admin/analysis",
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
                key: "needsSecondMeeting",
                label: "Needs Second Meeting",
                icon: CalendarClock,
                format: "number",
                foot: "caption",
                caption: "not yet scheduled",
            },
            {
                key: "secondMeetingGoodRate",
                label: "Second Meeting Success",
                icon: UserCheck2,
                format: "percent",
                foot: "progress",
                target: 100,
            },
            {
                key: "mvpOnTimeRate",
                label: "MVP On-Time Rate",
                icon: PackageCheck,
                format: "percent",
                foot: "progress",
                target: 100,
            },
            {
                key: "closingShowRate",
                label: "Closing Show Rate",
                icon: TrendingUp,
                format: "percent",
                foot: "progress",
                target: 100,
            },
            {
                key: "depositCollectionRate",
                label: "Deposit Collection Rate",
                icon: HandCoins,
                format: "percent",
                foot: "progress",
                target: 100,
            },
            {
                key: "totalContractValue",
                label: "Total Contract Value",
                icon: CircleDollarSign,
                format: "currency",
                foot: "caption",
                caption: "total booked revenue",
            },
            {
                key: "totalProfit",
                label: "Total Profit",
                icon: PiggyBank,
                format: "currency",
                foot: "caption",
                caption: "contract value minus project cost",
            },
        ],
        content: {
            greeting: "Hello, {firstName}",
            pipelineBreakdownTitle: "Pipeline Breakdown",
            pipelineBreakdownHint: "Leads by stage",
            clientStatusTitle: "Client Status",
            clientStatusHint: "Share of all leads",
            leaderboardTitle: "Rep Leaderboard",
            leaderboardHint: "Ranked by dials",
            repColumnLabel: "Rep",
            leaderboardRankedBy: "Ranked by {metric}",
            leaderboardCaption: "Sales reps ranked by {metric}",
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
