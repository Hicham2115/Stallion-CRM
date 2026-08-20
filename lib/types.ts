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

/** A sales rep. `dials` / `appointments` / `conversions` are running totals. */
export interface Rep {
  id: string;
  /** Display name as it appears in the UI, e.g. "Youssef K.". */
  name: string;
  email: string;
  /** Job title shown in Settings. Free text, not a permission. */
  role: string;
  dials: number;
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

/** A delivery milestone once a lead has become a paying client. */
export interface Milestone {
  id: string;
  label: string;
  status: MilestoneStatus;
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
  /** Matches Role in config/navigation.ts. */
  role: "admin" | "sales" | "client";
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
