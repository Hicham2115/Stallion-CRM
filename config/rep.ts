import {
  CalendarCheck,
  PhoneCall,
  Target,
  TrendingUp,
} from "lucide-react";

import type { KpiDefinition } from "@/config/admin";
import type { DataColumn } from "@/components/deck/data-table";

/**
 * ============================================================================
 *  SALES REP WORKSPACE CONFIGURATION
 * ============================================================================
 *  Single source of truth for everything under app/(console)/rep/ — the front
 *  a sales rep signs in to.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  WHAT THIS FRONT IS
 *  ──────────────────────────────────────────────────────────────────────────
 *  The agency console, narrowed to ONE PERSON. Every screen here has an admin
 *  twin, and the only difference is the lead set:
 *
 *      /admin            every lead        /rep            my leads
 *      /admin/clients    every client      /rep/clients    my clients
 *      /admin/pipeline   every lead        /rep/pipeline   my leads
 *      /admin/chat       every rep         /rep/chat       my manager
 *
 *  That is why the kanban, the funnel and the stage breakdown are the SAME
 *  COMPONENTS with a `leads` prop rather than rep-specific copies. A second
 *  kanban would be the one that stops getting fixes.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  THE SCOPE IS THE FEATURE, AND IT IS NOT SECURITY
 *  ──────────────────────────────────────────────────────────────────────────
 *  "My" means `lead.assignedRepId === session.repId`, applied in
 *  `selectRepLeads()`. A rep seeing a colleague's pipeline is not a disaster
 *  the way a client seeing another client's would be — but it is still the
 *  wrong screen, and commission disputes start there.
 *
 *  TODO(backend): filter server-side. The rep's API must return their own leads
 *  and nothing else, so a bug in a component cannot widen the set. See the
 *  field-ownership table in config/roles.ts.
 *
 *  Quick answers to the usual requests:
 *    - Hide a panel .............. features.<panel> = false
 *    - Retarget a KPI ............ kpis[n].target
 *    - Point the demo at another
 *      rep ....................... demo.repId
 *    - Reword anything ........... `content`
 * ============================================================================
 */

/** Which computed figure a rep KPI card shows. Keys into `RepKpiValues`. */
export type RepKpiKey =
  | "dialsToday"
  | "appointments"
  | "conversionRate"
  | "attendingRate";

export interface RepFeatureFlags {
  /** The four-card instrument cluster on the dashboard. */
  kpiCluster: boolean;
  /** The hairline ruler tying the cluster together. Pure chrome. */
  clusterRuler: boolean;
  /** "My Leads by Stage" bar list. */
  leadsByStage: boolean;
  /** "My Clients" list on the dashboard. */
  clientsPanel: boolean;
  /** Kanban ⇄ Funnel switch on the pipeline screen. */
  funnelView: boolean;
  /* Drag is NOT a flag here on purpose. The rep pipeline is the SAME
     `PipelineBoard` component as the admin one, narrowed by a `leads` prop, so
     it is governed by `boardConfig.features.dragAndDrop` — one switch for one
     board. A second flag would let the two disagree, and a rep unable to drag
     on a board that looks draggable is a bug report nobody could reproduce. */
  /** The "Add Client" button on My Clients. */
  addClient: boolean;
  /** Search box on My Clients. */
  search: boolean;
  /** The manager conversation. */
  chat: boolean;
  /** Log-a-call and add-a-note on a lead. */
  quickActions: boolean;
  /** Let a rep move a lead's stage from the lead page (as well as by drag). */
  stageControl: boolean;
}

export interface RepRoutes {
  home: string;
  clients: string;
  pipeline: string;
  chat: string;
  /** One lead. A function because the id is part of the path. */
  lead: (leadId: string) => string;
}

/**
 * Which rep the preview build signs in as.
 *
 * DELETE WITH THE MOCK. Once auth is real the rep's own id comes from the
 * session (`Session.repId` in lib/session.ts) and this goes away.
 */
export interface RepDemo {
  /**
   * The `Rep.id` shown when someone picks "Sales" on the login card.
   *
   * `rep-2` is Sara B., the rep in the original design. The eight reps are
   * `rep-1` … `rep-8` in lib/mock/seed.ts and each is assigned exactly ten
   * leads, so any of them makes a usable demo.
   */
  repId: string;
}

export interface RepConfig {
  features: RepFeatureFlags;
  routes: RepRoutes;
  demo: RepDemo;
  kpis: KpiDefinition<RepKpiKey>[];
  /**
   * My Clients table columns, in order.
   *
   * A SHORTER SET THAN THE ADMIN'S, and not by accident. The admin table gives
   * phone and email their own columns and puts the owning rep under each name,
   * because an admin is scanning eighty rows across nine people. A rep is
   * looking at their own handful: the owner is always them, so that line is
   * noise, and phone and email fit in one Contact cell that stays readable on a
   * laptop.
   */
  clientColumns: DataColumn[];
  content: {
    /** ---- Dashboard --------------------------------------------------- */
    dashboard: {
      kpiClusterLabel: string;
      leadsByStageTitle: string;
      leadsByStageHint: string;
      clientsTitle: string;
      clientsHint: string;
      clientsEmptyTitle: string;
      clientsEmptyDescription: string;
      /** Link at the foot of the clients panel. */
      clientsSeeAll: string;
      /**
       * How many clients the dashboard panel lists before deferring to the
       * My Clients screen. A product decision (how much of the dashboard this
       * panel is allowed to take), so it lives here rather than as a constant
       * in the component.
       */
      clientsPreviewLimit: number;
      emptyPipeline: string;
    };

    /** ---- My Clients -------------------------------------------------- */
    clients: {
      /** `{n}` is replaced. */
      countLabel: string;
      /** The table's visually-hidden `<caption>`. */
      tableCaption: string;
      /** `{name}` is replaced. Titles on the phone and email links. */
      callTitle: string;
      emailTitle: string;
      searchPlaceholder: string;
      searchLabel: string;
      emptyTitle: string;
      emptyDescription: string;
      noMatchTitle: string;
      noMatchDescription: string;
      clearSearch: string;
    };

    /** ---- My Pipeline ------------------------------------------------- */
    pipeline: {
      emptyTitle: string;
      emptyDescription: string;
    };

    /** ---- Manager chat ------------------------------------------------ */
    chat: {
      title: string;
      hint: string;
      /* No "not live yet" string here: `chatConfig.content.notLiveNotice` is
         printed by the shared MessageComposer, and a second copy in this file
         is a second place for the same promise to drift. */
      emptyTitle: string;
      emptyDescription: string;
      noManagerTitle: string;
      noManagerDescription: string;
    };

    /** ---- Lead detail ------------------------------------------------- */
    lead: {
      back: string;
      /** Shown when a rep opens a lead that is not theirs. */
      forbiddenTitle: string;
      forbiddenDescription: string;
      forbiddenAction: string;
      notFoundTitle: string;
      notFoundDescription: string;
      stageLabel: string;
      stageToast: string;
    };

    /** ---- Whole-screen states ----------------------------------------- */
    missingRepTitle: string;
    missingRepDescription: string;
  };
}

export const repConfig: RepConfig = {
  features: {
    kpiCluster: true,
    clusterRuler: true,
    leadsByStage: true,
    clientsPanel: true,
    funnelView: true,
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
    lead: (leadId: string) => `/rep/leads/${leadId}`,
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
      clientsEmptyDescription:
        "A lead you move into the Client stage appears here.",
      clientsSeeAll: "See all my clients",
      clientsPreviewLimit: 6,
      emptyPipeline: "No leads assigned to you yet.",
    },

    clients: {
      countLabel: "{n} clients",
      tableCaption:
        "Clients you have converted, with their contact details and latest note",
      callTitle: "Call {name}",
      emailTitle: "Email {name}",
      searchPlaceholder: "Search clients…",
      searchLabel: "Search my clients",
      emptyTitle: "No clients yet",
      emptyDescription:
        "Convert a lead from your pipeline and it lands here.",
      noMatchTitle: "Nothing matches",
      noMatchDescription: "Try a different name, company or email.",
      clearSearch: "Clear search",
    },

    pipeline: {
      emptyTitle: "Your pipeline is empty",
      emptyDescription:
        "Leads assigned to you appear here. Add one from My Clients, or ask your manager to assign you some.",
    },

    chat: {
      title: "Your manager",
      hint: "One conversation",
      emptyTitle: "No messages yet",
      emptyDescription: "Send the first one.",
      noManagerTitle: "No manager assigned",
      noManagerDescription:
        "Once a manager is set for your team, your conversation appears here.",
    },

    lead: {
      back: "My Pipeline",
      // A rep hitting another rep's lead is a wrong turn, not a crime — say so
      // plainly and give them the way back.
      forbiddenTitle: "That lead is not yours",
      forbiddenDescription:
        "It is assigned to someone else on the team. Ask your manager if it should be yours.",
      forbiddenAction: "Back to my pipeline",
      notFoundTitle: "That lead does not exist",
      notFoundDescription:
        "It may have been deleted, or the link may be out of date.",
      stageLabel: "Stage",
      stageToast: "{name} moved to {stage}",
    },

    missingRepTitle: "We cannot find your rep profile",
    missingRepDescription:
      "Your sign-in points at a rep record that is no longer there. Sign in again, or ask your manager.",
  },
};
