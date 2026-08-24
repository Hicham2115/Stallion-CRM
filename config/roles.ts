import { adminConfig } from "@/config/admin";
import { devConfig } from "@/config/dev";
import { portalConfig } from "@/config/portal";
import { repConfig } from "@/config/rep";

/**
 * ============================================================================
 *  ROLES AND THE DATA FLOW BETWEEN THEM
 *  ←←← BACKEND DEVELOPERS: THIS IS THE MAP. READ IT BEFORE THE SCHEMA.
 * ============================================================================
 *  Four people use this product and they all work on the SAME RECORD. There is
 *  no separate "project" table, no separate "client" table: a client is a lead
 *  whose stage is the won stage, and a project is the delivery half of that
 *  same lead. See `Lead` in lib/types.ts.
 *
 *  That single record is the whole design. It is also the whole risk — every
 *  role writing into one row means the boundaries have to be stated somewhere,
 *  and this is where.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  WHO TOUCHES WHAT
 *  ──────────────────────────────────────────────────────────────────────────
 *
 *      ┌─── sales / admin ────────────┐
 *      │  create the lead, work it    │
 *      │  through the pipeline, and   │
 *      │  convert it to a client      │
 *      │  (a rep sees only their own; │
 *      │   an admin sees all of them) │
 *      └──────────────┬───────────────┘
 *                     │ writes: name, company, phone, email, source,
 *                     │         stageId, assignedRepId, notes, activity,
 *                     ▼         invoices, files
 *      ╔══════════════════════════════════════════════════╗
 *      ║                   ONE  LEAD                      ║
 *      ║  identity · sales history · delivery · billing   ║
 *      ╚══════════════════════════════════════════════════╝
 *                     ▲                          │
 *                     │ writes: milestones,      │ reads: the delivery
 *                     │   previews, liveUrl,     │        half only
 *                     │   updates, files,        ▼
 *                     │   projectSummary   ┌──────────────┐
 *      ┌──────────────┴───────────┐        │   client     │
 *      │        dev team          │        │   /portal    │
 *      │  /dev — delivery only,   │        └──────────────┘
 *      │  never the pipeline      │
 *      └──────────────────────────┘
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  FIELD OWNERSHIP  (the table to reproduce in your API's authorisation layer)
 *  ──────────────────────────────────────────────────────────────────────────
 *
 *    field                    written by        readable by
 *    ─────────────────────────────────────────────────────────────────────
 *    name, company            sales, admin      everyone
 *    phone, email             sales, admin      sales, admin, dev
 *    source                   sales, admin      sales, admin        ← NOT client
 *    stageId                  sales, admin      sales, admin        ← NOT client
 *    assignedRepId            admin             sales, admin, dev,
 *                                               client (NAME only)
 *    notes                    sales, admin      sales, admin        ← NOT client
 *    activity                 system            sales, admin        ← NOT client
 *    daysInStage,             system            sales, admin        ← NOT client
 *      createdDaysAgo
 *    invoices                 admin             admin, client
 *    files                    admin, dev        admin, dev, client
 *    ─────────── the delivery half, written by the dev team ──────────────
 *    projectSummary           dev, admin        everyone
 *    milestones               dev               admin, dev, client
 *    previews                 dev               admin, dev, client
 *    liveUrl                  dev               admin, dev, client
 *    updates                  dev               admin, dev, client
 *
 *  The four "NOT client" rows are the ones that matter. `notes` says things
 *  like "currently working with a competitor agency" and `activity` says
 *  "First dial attempt made" — both true, both internal, both about the person
 *  who would be reading them. The rule is written up in full as the
 *  CLIENT-SAFE RULE at the top of config/portal.ts.
 *
 *  A dev sees the client's phone and email (they may need to ask a direct
 *  question about content) but never the source, the stage, the notes or the
 *  sales timeline. None of it helps them build anything, and a developer
 *  quoting "you came in from cold outreach" on a call is a real way to lose an
 *  account.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  HOW A CHANGE TRAVELS TODAY
 *  ──────────────────────────────────────────────────────────────────────────
 *    component -> useCrm() action -> lib/crm-api.ts -> (today) a mock record
 *                                                   -> (later) your endpoint
 *    The action applies whatever comes back to the store, and every screen
 *    reading that lead re-renders. So a dev ticking a step and a client seeing
 *    their progress move are the same write, not two features that have to be
 *    kept in step.
 *
 *    They are not yet the same SESSION, though: the store is per-browser
 *    localStorage, so today a dev's edit reaches the client only because both
 *    roles are being demoed in one browser. That is the single biggest thing
 *    the backend changes — see the TODO at the top of lib/crm-api.ts.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  WHERE THE ROLE COMES FROM
 *  ──────────────────────────────────────────────────────────────────────────
 *    lib/session.ts          reads it (an unsigned cookie today)
 *    config/navigation.ts    decides which nav items exist for it
 *    the four route guards   decide which URLs it may enter:
 *                              app/(console)/admin/layout.tsx
 *                              app/(console)/rep/layout.tsx
 *                              app/(console)/dev/layout.tsx
 *                              app/(console)/portal/layout.tsx
 *
 *  None of that is security while the cookie is unsigned. It is the right
 *  SHAPE — server-side, before any markup — and it becomes a boundary the day
 *  `readSession()` verifies a real session AND the API filters its responses
 *  by role. Both halves are required; either one alone is theatre.
 * ============================================================================
 */

/**
 * Who a person is, which decides what they can see and write.
 *
 * Adding a fifth role means: an entry in `roleDefinitions` below, nav items
 * with that role in config/navigation.ts, a route guard for its own folder,
 * and a row in the ownership table above. In that order.
 */
export type Role = "admin" | "sales" | "dev" | "client";

export interface RoleDefinition {
  id: Role;
  /**
   * Where this role lands after sign-in, and where its sidebar logo points.
   * The single source — `homeFor()` in lib/session.ts is the only reader.
   */
  home: string;
  /**
   * Uppercase pill beside the name in the topbar. Empty string renders no
   * pill, which is right for a role that is the product's default audience.
   */
  badge: string;
  /**
   * One line: what this person is here to do. Not shown in the UI — it is for
   * whoever is deciding whether a new screen belongs to this role.
   */
  purpose: string;
  /**
   * Fields on `Lead` this role may write, matching the table above.
   *
   * DOCUMENTATION, NOT ENFORCEMENT. Nothing reads this at runtime, deliberately:
   * a client-side permission check is a suggestion, and pretending otherwise is
   * worse than not having one. It is here so the API's authorisation layer has
   * something exact to be built from.
   */
  writes: readonly string[];
  /** Fields this role must never receive from the API at all. */
  neverReads: readonly string[];
  /**
   * Which readout this role gets at the foot of the sidebar.
   *
   *   "team"  the agency's dial average across all reps  (admin)
   *   "own"   this person's own dials today              (sales)
   *   "none"  no readout at all                          (dev, client)
   *
   * DECLARED HERE BECAUSE IT WAS PREVIOUSLY DECLARED TWICE — the same
   * `role === "admin" || role === "sales"` allow-list lived in both
   * console-sidebar.tsx and mobile-nav.tsx, with a third check inside
   * SidebarStat deciding which figure to show. Three places to update for one
   * new role is two places to forget.
   */
  sidebarStat: "team" | "own" | "none";
  /**
   * Where THIS role opens one lead record.
   *
   * The same lead is a different page to each audience: a client record to an
   * admin, one of my leads to a rep, a project to a developer. Components
   * shared between fronts — `LeadCard` on the kanban, most obviously — look the
   * route up here instead of hard-coding one front's path.
   *
   * That was a live bug: the kanban card linked to `/admin/clients/{id}`
   * unconditionally, so a rep clicking a card on their OWN board was sent to a
   * URL their route guard immediately bounced them out of.
   *
   * A client never opens a lead by id — see `usePortalLead()` for why the
   * portal has no such route — so theirs returns their own home.
   */
  leadRoute: (leadId: string) => string;
}

const NOTHING: readonly string[] = [];

export const roleDefinitions: Record<Role, RoleDefinition> = {
  admin: {
    id: "admin",
    home: "/admin",
    badge: "Admin",
    purpose:
      "Runs the agency: pipeline health, rep performance, stages, billing.",
    writes: [
      "name", "company", "phone", "email", "source", "stageId",
      "assignedRepId", "notes", "invoices", "files", "projectSummary",
    ],
    neverReads: NOTHING,
    sidebarStat: "team",
    leadRoute: adminConfig.routes.client,
  },

  sales: {
    id: "sales",
    home: repConfig.routes.home,
    badge: "Sales rep",
    purpose:
      "Works their OWN leads day to day: dials, stage moves, notes, appointments.",
    writes: [
      "name", "company", "phone", "email", "source", "stageId", "notes",
      "activity (via log-a-call)", "assignedRepId (themselves, on create)",
    ],
    // Not a privacy boundary the way the client's is — a rep may legitimately
    // learn a colleague's figures over lunch. It is a SCOPE: their screens are
    // built around one pipeline, and a rep reading the whole database is
    // looking at a manager's screen. Commission disputes start there.
    neverReads: [
      "other reps' leads",
      "team-wide KPIs",
      "rep leaderboard",
      "reports",
      "settings",
    ],
    // Their own dials, never the team average: a rep cannot act on an average
    // and would spend a week wondering why "their" number never matched what
    // they did.
    sidebarStat: "own",
    leadRoute: repConfig.routes.lead,
  },

  dev: {
    id: "dev",
    home: devConfig.routes.home,
    badge: "Dev team",
    purpose:
      "Delivers the work once a lead converts, and publishes progress to the client.",
    writes: [
      "milestones", "previews", "liveUrl", "updates", "files", "projectSummary",
    ],
    // A developer has no reason to see the funnel, and every reason not to
    // repeat it to a client.
    neverReads: ["source", "stageId", "notes", "activity", "daysInStage"],
    // A sales KPI on a delivery screen is noise that has to be learned and
    // then ignored.
    sidebarStat: "none",
    // To a developer, a lead IS the project.
    leadRoute: devConfig.routes.project,
  },

  client: {
    id: "client",
    home: portalConfig.routes.home,
    badge: portalConfig.content.identity.roleBadge,
    purpose:
      "Sees their own project: progress, previews, the live link, files, invoices.",
    // A client writes nothing today. When they do — approving a preview,
    // uploading a brief — add it here first and build it second.
    writes: NOTHING,
    neverReads: [
      "source", "stageId", "notes", "activity", "daysInStage",
      "createdDaysAgo", "assignedRepId (beyond the rep's name and email)",
    ],
    // The agency's own performance data, in the sidebar of a screen a paying
    // customer opens. Never.
    sidebarStat: "none",
    // A client has exactly one project and reaches it from the session, never
    // by id. Anything else here would be a URL worth trying.
    leadRoute: () => portalConfig.routes.home,
  },
};

/** Every role, in the order they appear through a project's life. */
export const allRoles: Role[] = ["admin", "sales", "dev", "client"];

/**
 * Where a role belongs after signing in.
 *
 * Falls back to the admin console for an unrecognised role rather than
 * throwing: a stale cookie from an older build should land somewhere real, not
 * white-screen the app.
 */
export function homeForRole(role: Role): string {
  return roleDefinitions[role]?.home ?? roleDefinitions.admin.home;
}

/** Whether a string is a role this build knows about. Used when parsing the
 *  session cookie, where the value is whatever the browser happened to send. */
export function isRole(value: unknown): value is Role {
  return typeof value === "string" && value in roleDefinitions;
}
