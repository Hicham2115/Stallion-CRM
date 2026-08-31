import { CalendarCheck, PhoneCall, Target, TrendingUp, } from "lucide-react";
export const repConfig = {
    features: {
        kpiCluster: true,
        clusterRuler: true,
        leadsByStage: true,
        clientsPanel: true,
        // Disabled — same reason as boardConfig.features.funnelView on the
        // admin side: still on the mock crm-store, not real data.
        funnelView: false,
        addClient: true,
        search: true,
        chat: true,
        quickActions: true,
        stageControl: true,
    },
    routes: {
        home: "/rep",
        clients: "/rep/clients",
        pipeline: "/rep/pipeline",
        chat: "/rep/chat",
    },
    demo: {
        repId: "rep-2",
    },
    clientColumns: [
        { key: "name", label: "Name", width: "w-[16rem]" },
        { key: "company", label: "Company", hideBelow: "lg" },
        { key: "contact", label: "Contact" },
        { key: "source", label: "Source", hideBelow: "md" },
        { key: "notes", label: "Notes", hideBelow: "xl" },
    ],
    /**
     * The four gauges, in reading order: what I did today, what it produced,
     * and the two rates it is judged on.
     *
     * WHY NOT THE ADMIN'S FOUR. The admin cluster answers "how is the team
     * doing"; three of its cards (total clients, team dials/rep, overall
     * conversion) are aggregates a rep cannot move on their own. A rep's four
     * are all first-person, and each is actionable this afternoon.
     *
     * Every figure is DERIVED in `selectRepKpis()` — see lib/store/selectors.ts,
     * which documents the exact formula for whoever serves these from the API.
     */
    kpis: [
        {
            key: "dialsToday",
            label: "My Dials Today",
            icon: PhoneCall,
            format: "number",
            // The caption carries the all-time figure. Today's number is what a rep
            // is managed on; the total is context, and putting it here means the two
            // can never be mistaken for each other — which is exactly what happened
            // in the prototype, where the all-time total wore a "Today" label.
            foot: "caption",
            caption: "{n} all time",
        },
        {
            key: "appointments",
            label: "My Appointments",
            icon: CalendarCheck,
            format: "number",
            foot: "caption",
            caption: "across {n} leads",
        },
        {
            key: "conversionRate",
            label: "My Conversion Rate",
            icon: TrendingUp,
            format: "percent",
            foot: "progress",
            /** Share of my leads that became clients. */
            target: 25,
        },
        {
            key: "attendingRate",
            label: "My Attending Rate",
            icon: Target,
            format: "percent",
            foot: "progress",
            /** Share of my booked appointments that were actually attended. */
            target: 75,
        },
    ],
    content: {
        dashboard: {
            kpiClusterLabel: "My performance",
            leadsByStageTitle: "My Leads by Stage",
            leadsByStageHint: "Where my leads sit",
            clientsTitle: "My Clients",
            clientsHint: "Converted by me",
            clientsEmptyTitle: "No clients yet",
            clientsEmptyDescription: "A lead you move into the Client stage appears here.",
            clientsSeeAll: "See all my clients",
            clientsPreviewLimit: 6,
            emptyPipeline: "No leads assigned to you yet.",
        },
        clients: {
            countLabel: "{n} clients",
            tableCaption: "Clients you have converted, with their contact details and latest note",
            callTitle: "Call {name}",
            emailTitle: "Email {name}",
            searchPlaceholder: "Search clients…",
            searchLabel: "Search my clients",
            emptyTitle: "No clients yet",
            emptyDescription: "Convert a lead from your pipeline and it lands here.",
            noMatchTitle: "Nothing matches",
            noMatchDescription: "Try a different name, company or email.",
            clearSearch: "Clear search",
        },
        pipeline: {
            emptyTitle: "The pipeline is empty",
            emptyDescription: "Leads submitted from the site, or added from My Clients, show up here.",
        },
        chat: {
            title: "Your manager",
            hint: "One conversation",
            emptyTitle: "No messages yet",
            emptyDescription: "Send the first one.",
            noManagerTitle: "No manager assigned",
            noManagerDescription: "Once a manager is set for your team, your conversation appears here.",
        },
        lead: {
            back: "My Pipeline",
            // A rep hitting another rep's lead is a wrong turn, not a crime — say so
            // plainly and give them the way back.
            forbiddenTitle: "That lead is not yours",
            forbiddenDescription: "It is assigned to someone else on the team. Ask your manager if it should be yours.",
            forbiddenAction: "Back to my pipeline",
            notFoundTitle: "That lead does not exist",
            notFoundDescription: "It may have been deleted, or the link may be out of date.",
            stageLabel: "Stage",
            stageToast: "{name} moved to {stage}",
        },
        missingRepTitle: "We cannot find your rep profile",
        missingRepDescription: "Your sign-in points at a rep record that is no longer there. Sign in again, or ask your manager.",
    },
};
