/**
 * ============================================================================
 *  DOMAIN TYPES
 * ============================================================================
 *  The shapes the whole console is built on. These are the contract between
 *  the UI and whatever eventually serves the data, so they are the first thing
 *  to agree on with the backend team.
 *
 *  A note on dates: records store `daysAgo` / `daysInStage` as whole numbers
 *  rather than timestamps. That is deliberate for the mock — computing "5 days
 *  ago" from `Date.now()` during render can straddle a tick between the server
 *  render and the client render and produce two different strings, which React
 *  reports as a hydration mismatch.
 *
 *  TODO(backend): real records will carry ISO timestamps. Add `createdAt` /
 *  `stageChangedAt` alongside these fields and derive the day counts
 *  client-side; do not remove the day-count fields until every consumer has
 *  moved over.
 * ============================================================================
 */

import type { Role } from "@/config/roles";

/**
 * A sales rep.
 *
 * `dials` / `appointments` / `conversions` are RUNNING TOTALS — all-time
 * counters, not figures for any particular window. That distinction became
 * load-bearing the moment the rep workspace existed: a rep's own dashboard
 * leads with what they did TODAY, and the prototype filled that card with the
 * all-time dial count under a "Today" label. A running total wearing a daily
 * label is correct for exactly one day.
 *
 * TODO(backend): these counters are the weakest part of this shape. Real
 * systems store dated CALL and APPOINTMENT records and aggregate on read,
 * which is what makes "today", "this week" and "last quarter" all answerable
 * from one source. Keep the counters until every consumer has moved, then drop
 * them — `selectRepKpis()` in lib/store/selectors.ts names each formula.
 */
export interface Rep {
  id: string;
  /** Display name as it appears in the UI, e.g. "Youssef K.". */
  name: string;
  email: string;
  /** Job title shown in Settings. Free text, not a permission. */
  role: string;
  dials: number;
  /**
   * Dials made TODAY. The headline figure on the rep's own dashboard and the
   * readout pinned to their sidebar.
   *
   * A separate field rather than a slice of `dials`, because nothing in this
   * data model knows WHEN a dial happened — see the TODO above. Always <=
   * `dials`: you cannot have made more calls today than you have ever made.
   */
  dialsToday: number;
  appointments: number;
  conversions: number;
  /** Deactivated reps stay in the list but stop appearing in assignment menus. */
  active: boolean;
}

/** A note left on a lead. */
export interface Note {
  id: string;
  body: string;
  authorName: string;
  daysAgo: number;
}

/** One line in a lead's activity timeline. */
export interface ActivityEvent {
  id: string;
  label: string;
  daysAgo: number;
}

export type MilestoneStatus = "done" | "in_progress" | "pending";

/**
 * A delivery milestone once a lead has become a paying client.
 *
 * THE MIDDLE STATE IS DERIVED, NOT SET. The dev workspace shows one checkbox
 * per step — done or not done — and after every edit the first step that is
 * not done becomes `in_progress` and the rest `pending`. See
 * `normalizeMilestones()` in lib/crm-api.ts, which is the only thing that
 * should ever write this field.
 *
 * That is what lets the client read "We're working on Development" without
 * anyone having to remember to move a second marker, which is the version of
 * this that goes stale within a week.
 */
export interface Milestone {
  id: string;
  label: string;
  status: MilestoneStatus;
  /**
   * When this step is expected to be finished. `null` when no date is set,
   * which is the normal case — a date is a promise, and most steps should not
   * carry one.
   *
   * An ISO calendar date (`"2026-09-15"`), NOT a timestamp and NOT a day
   * count. Two reasons, and they pull in different directions on purpose:
   *
   *   - a day count ("due in 12 days") is what the rest of this file uses, but
   *     it silently stops being true the moment it is stored — reopen it a
   *     week later and it still says 12
   *   - a full timestamp implies a time of day that nobody chose
   *
   * A calendar date formats deterministically from a fixed locale, so the
   * server and client renders agree (see the date note at the top of this
   * file). Anything that compares it to *today* — "is this overdue" — must run
   * client-side only, after hydration, or it is a mismatch waiting to happen.
   */
  targetDate: string | null;
}

/** A file attached to a client. */
export interface LeadFile {
  id: string;
  name: string;
}

export type InvoiceStatus = "paid" | "overdue" | "pending";

export interface Invoice {
  id: string;
  /** Human reference, e.g. "INV-1060". */
  reference: string;
  /** Amount in the currency named by adminConfig.currency. */
  amount: number;
  status: InvoiceStatus;
}

/* --------------------------------------------------------------------------
   CLIENT-VISIBLE PROJECT DATA
   --------------------------------------------------------------------------
   Everything below is shown to the CLIENT in their own portal
   (app/(console)/portal/). That makes it a different kind of field from the
   rest of this file, and the difference is the whole point:

     internal (never leaves the agency)   sources, stages, notes, dials,
                                          rep assignment, the activity log
     client-visible (portal)              the four fields at the bottom of
                                          Lead, plus milestones, files and
                                          invoices

   A lead's `notes` say things like "currently working with a competitor
   agency" and its `source` can say "Cold Outreach". Neither belongs in front
   of the person they describe. See the CLIENT-SAFE RULE at the top of
   config/portal.ts.
   -------------------------------------------------------------------------- */

/**
 * A version of the work shared with the client for review.
 *
 * Deliberately NOT called a "staging build" or a "deploy". The client sees
 * this, and the words a client uses are "preview" and "live" — see
 * `content.links` in config/portal.ts, where every string is one edit away.
 */
export interface ProjectPreview {
  id: string;
  /** What was shared, in the client's language, e.g. "Homepage — round 2". */
  label: string;
  /** One line on what changed since last time. Optional. */
  note?: string;
  /**
   * Screenshot of the preview. `null` while nothing has been uploaded, which
   * the portal renders as a designed placeholder rather than a broken image.
   *
   * TODO(backend): serve a signed, expiring URL. A client preview can show
   * unreleased branding and must not sit behind a guessable path.
   */
  imageUrl: string | null;
  /** Where the client can open it. `null` for a picture-only update. */
  url: string | null;
  updatedDaysAgo: number;
}

/**
 * A short, agency-authored note to the client: "Design approved, development
 * starts Monday."
 *
 * This exists so the portal never has to show `Lead.activity`, which is the
 * SALES timeline — "First dial attempt made" is a true statement about a lead
 * and an insulting one to a paying client. Updates are written for the client;
 * activity is written for the agency.
 */
export interface ProjectUpdate {
  id: string;
  /** Headline, one short sentence. */
  title: string;
  /** Optional detail underneath. Keep it to a line or two. */
  body?: string;
  daysAgo: number;
}

/**
 * A lead — the central record. A "client" is not a separate entity: it is a
 * lead whose `stageId` points at the stage flagged `isWon` in
 * config/pipeline.ts. That is why the Clients screen and the pipeline's Client
 * column can never disagree about the count.
 */
export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  /** One of pipelineConfig.sources. */
  source: string;
  /** One of pipelineConfig.stages[].id. */
  stageId: string;
  /** Rep.id, or null if unassigned. */
  assignedRepId: string | null;
  daysInStage: number;
  /**
   * How many whole days ago this lead was created.
   *
   * This is what makes the Reports date range mean anything. Without it every
   * lead was equally "now", so a 7-day report and a 90-day report returned
   * identical figures — the control was decorative. Always >= daysInStage: a
   * lead cannot have sat in its current stage longer than it has existed.
   *
   * TODO(backend): derives from the real `createdAt` timestamp. See the date
   * note at the top of this file for why it is a day count and not a Date.
   */
  createdDaysAgo: number;
  /** Newest first. The Clients table shows notes[0]. */
  notes: Note[];
  /** Newest last, so the timeline reads top-to-bottom in chronological order. */
  activity: ActivityEvent[];
  milestones: Milestone[];
  files: LeadFile[];
  invoices: Invoice[];

  /* ---- Client-visible project fields. Empty until the lead converts. ---- */

  /**
   * What the agency is building, in one line the client would recognise.
   * Shown under their name in the portal header. Empty string for a lead that
   * has not converted.
   */
  projectSummary: string;
  /** Work-in-progress versions shared for review. Newest first. */
  previews: ProjectPreview[];
  /**
   * The finished, public thing — the site or app the client's own customers
   * use. `null` until launch, which is what the portal reads to decide
   * between "not live yet" and "your live site".
   */
  liveUrl: string | null;
  /** Agency-authored notes to the client. Newest first. */
  updates: ProjectUpdate[];
}

/** A message in a rep conversation. */
export interface ChatMessage {
  id: string;
  authorName: string;
  body: string;
  /** Pre-formatted label, e.g. "Mon 9:14 AM". See the date note at the top. */
  timeLabel: string;
  /** True when the signed-in user wrote it — drives alignment and colour. */
  fromMe: boolean;
}

/** One conversation, always between the signed-in user and one rep. */
export interface ChatThread {
  id: string;
  repId: string;
  messages: ChatMessage[];
}

/** The signed-in user.
 *  TODO(backend): replace with the real session. `role` decides what the
 *  sidebar shows, but must ALSO be enforced server-side on every route. */
export interface CurrentUser {
  id: string;
  name: string;
  /** Job title under the name in the topbar. */
  title: string;
  /** Uppercase pill next to the name, e.g. "ADMIN". */
  roleBadge: string;
  /**
   * THE type, not a copy of it.
   *
   * This was written out by hand as `"admin" | "sales" | "client"` with a
   * comment saying it matched `Role` — and it stopped matching the moment a
   * fourth role was added, exactly as that kind of comment always does. The
   * union now comes from config/roles.ts, so a new role is a type error here
   * rather than a silent omission.
   */
  role: Role;
}

/** Everything the console holds in memory. */
export interface CrmState {
  currentUser: CurrentUser;
  reps: Rep[];
  leads: Lead[];
  threads: ChatThread[];
  /** Stage ids + labels, mutable from Settings. Seeded from config/pipeline.ts. */
  stageOrder: { id: string; label: string }[];
  /** Seven daily team dial averages, oldest first — the KPI sparkline. */
  teamDialsHistory: number[];
  /** False until the persisted state has been read. See lib/store/crm-store.tsx. */
  hydrated: boolean;
}
