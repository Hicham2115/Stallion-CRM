/**
 * ============================================================================
 *  CRM API BOUNDARY  ←←← BACKEND DEVELOPERS: THIS IS THE FILE YOU EDIT
 * ============================================================================
 *  The console never talks to a server directly. Every write goes through one
 *  of the functions below, so wiring the real backend means replacing the
 *  bodies in this file and nothing else. No component changes, no page
 *  changes — the loading, error and optimistic states all keep working.
 *
 *  Same pattern as lib/auth.ts, deliberately.
 *
 *  HOW IT FITS TOGETHER
 *    component  ->  useCrm() action  ->  crm-api function  ->  (today) mock
 *                                                          ->  (later) fetch
 *    The action then applies the returned record to local state. That split is
 *    on purpose: this file is TRANSPORT (it produces records), and the store is
 *    a CACHE (it holds them). A real API returns the created row — including
 *    the server-generated id and timestamps — so the store applies whatever
 *    comes back rather than guessing.
 *
 *  WHEN YOU CONNECT THE BACKEND
 *    1. Set CRM_BACKEND_CONNECTED = true.
 *    2. Replace each TODO block with the real call.
 *    3. Delete lib/mock/ and lib/store/persistence.ts.
 *    4. Turn off consoleConfig.features.mockDataChip.
 * ============================================================================
 */

import { pipelineConfig } from "@/config/pipeline";
import type {
  ActivityEvent,
  Invoice,
  Lead,
  Milestone,
  Note,
  ProjectPreview,
  ProjectUpdate,
  Rep,
} from "@/lib/types";

/**
 * Flip to `true` once the TODO blocks below actually call your backend.
 *
 * While it is `false` every function returns mock records and the console runs
 * on sample data held in the browser. While it is `true` the unimplemented
 * functions fail loudly rather than quietly serving fake data that looks real.
 */
const CRM_BACKEND_CONNECTED = false;

/**
 * A discriminated union so callers can react precisely:
 *   - `ok: true`      -> apply `data` to local state
 *   - `field` present -> highlight that input and show the message there
 *   - `field` absent  -> show the message at form level
 */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; field?: string };

/** Keeps pending states visible while the stub is in place. Delete with the mocks. */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Guard for the connected-but-unimplemented case. Better a loud failure than
 *  a dashboard quietly showing invented numbers to the agency. */
function notImplemented<T>(name: string): ApiResult<T> {
  return {
    ok: false,
    message: `${name}() is not implemented. See lib/crm-api.ts.`,
  };
}

/**
 * Client-side id for mock records.
 *
 * Only ever called from an event handler, never during render, so it cannot
 * cause a hydration mismatch. `crypto.randomUUID` needs a secure context, which
 * localhost counts as — the fallback covers plain-HTTP staging boxes.
 *
 * TODO(backend): delete this. Ids must come from the server, otherwise two
 * offline tabs can mint the same one.
 */
function localId(prefix: string): string {
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${unique}`;
}

/* ==========================================================================
   CLIENTS & LEADS
   ========================================================================== */

export interface NewClientInput {
  name: string;
  company: string;
  phone: string;
  email: string;
  /**
   * How the lead reached us. A SALES field.
   *
   * Optional because the dev workspace can start a project directly, and a
   * developer has no idea where the client came from. Guessing would be worse
   * than leaving it blank: a wrong source quietly skews the Reports breakdown,
   * which is the one screen the agency uses to decide where to spend money.
   * An empty value renders as "Not recorded" — see components/deck/source-badge.tsx.
   */
  source?: string;
  note?: string;
  /** One line on what is being built. Shown to the client on their portal. */
  projectSummary?: string;
  /**
   * Who owns the record.
   *
   * A rep creating a client passes their OWN id, so it lands in their pipeline
   * rather than an unassigned pool nobody looks at. The admin dialog leaves it
   * null and assigns afterwards.
   */
  assignedRepId?: string | null;
  /**
   * Who is creating the record, for the first note's byline.
   *
   * The store fills it from the session — see CrmProvider. It used to be the
   * literal string "You", which is correct for the person typing and wrong for
   * everyone else who ever opens the record.
   */
  authorName?: string;
}

/**
 * Create a client. Used by the "Add client" dialog.
 *
 * Never throw for an expected failure (duplicate email, invalid phone) —
 * return `{ ok: false, message, field }` so the dialog can point at the offending
 * input. Reserve throwing for genuine outages.
 */
export async function createClient(
  input: NewClientInput,
): Promise<ApiResult<Lead>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(320);

    const lead: Lead = {
      id: localId("lead"),
      name: input.name,
      company: input.company,
      phone: input.phone,
      email: input.email,
      source: input.source ?? "",
      // A record created from the Clients screen — or from the dev workspace —
      // is a paying client by definition. That is what both screens list.
      stageId: pipelineConfig.wonStageId,
      assignedRepId: input.assignedRepId ?? null,
      daysInStage: 0,
      // Created just now, so it falls inside every Reports date range.
      createdDaysAgo: 0,
      notes: input.note
        ? [
            {
              id: localId("note"),
              body: input.note,
              authorName: input.authorName ?? "",
              daysAgo: 0,
            },
          ]
        : [],
      activity: [{ id: localId("act"), label: "Lead created", daysAgo: 0 }],
      milestones: [],
      files: [],
      invoices: [],

      // Client-visible fields, all deliberately empty. A client added from the
      // Clients screen has no project plan, no preview and nothing live yet,
      // and the portal has a designed empty state for each — inventing a
      // placeholder preview link here would put a dead link in front of the
      // client on day one.
      projectSummary: input.projectSummary?.trim() ?? "",
      previews: [],
      liveUrl: null,
      updates: [],
    };

    return { ok: true, data: lead };
  }

  // TODO(backend): replace with the real call, e.g.
  //
  //   const response = await fetch("/api/clients", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(input),
  //   });
  //
  //   if (response.status === 409) {
  //     return { ok: false, message: "A client with that email already exists.",
  //              field: "email" };
  //   }
  //   if (!response.ok) {
  //     return { ok: false, message: "We could not reach the server." };
  //   }
  //   return { ok: true, data: (await response.json()) as Lead };
  return notImplemented<Lead>("createClient");
}

/** Delete a lead. Resolves with the id so the store knows what to drop. */
export async function deleteLead(id: string): Promise<ApiResult<string>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(220);
    return { ok: true, data: id };
  }

  // TODO(backend): DELETE /api/leads/{id}
  //   A 404 here is usually harmless (someone else already deleted it) — treat
  //   it as success so the row still disappears from this user's screen.
  return notImplemented<string>("deleteLead");
}

/**
 * Put back a lead that was just deleted — what the Undo on the delete toast
 * calls.
 *
 * Works today because the mock delete never really destroyed anything: the
 * record was only dropped from the client-side store, and the component still
 * holds it.
 *
 * TODO(backend): a real DELETE cannot be undone by re-posting the record. The
 * server would mint a new id, and the audit trail would show a delete followed
 * by a create rather than a mistake that was corrected. Pick one of:
 *
 *   a) SOFT DELETE — DELETE sets `deleted_at`, this endpoint clears it. The id
 *      survives, so notes, files and invoices stay attached. Recommended.
 *   b) DEFERRED DELETE — hold the request for the toast's lifetime and cancel
 *      it if Undo is pressed. Simpler server-side, but the record is still
 *      visible to other users during the window, and a closed tab commits it.
 *
 * Whichever is chosen, the undo window in the UI must match what the server
 * actually guarantees — see `showUndoToast` in components/deck/confirm-dialog.tsx.
 */
export async function restoreLead(lead: Lead): Promise<ApiResult<Lead>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(160);
    return { ok: true, data: lead };
  }

  // TODO(backend): POST /api/leads/{id}/restore
  return notImplemented<Lead>("restoreLead");
}

/**
 * Move a lead to another stage. Called by the kanban drag, the stage select on
 * the lead detail page, and "Convert to Client".
 *
 * Returns the updated lead so the store never has to guess what the server did
 * — a real backend also stamps the stage-change time and may append its own
 * activity entry.
 */
export async function moveLeadToStage(
  lead: Lead,
  stageId: string,
): Promise<ApiResult<Lead>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(160);

    const stage = pipelineConfig.stages.find((entry) => entry.id === stageId);

    return {
      ok: true,
      data: {
        ...lead,
        stageId,
        daysInStage: 0,
        activity: [
          ...lead.activity,
          {
            id: localId("act"),
            label: `Moved to ${stage?.label ?? stageId}`,
            daysAgo: 0,
          },
        ],
      },
    };
  }

  // TODO(backend): PATCH /api/leads/{id} { stageId }
  return notImplemented<Lead>("moveLeadToStage");
}

/** Reassign a lead to a different rep. */
export async function assignLeadToRep(
  lead: Lead,
  repId: string | null,
): Promise<ApiResult<Lead>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(160);
    return { ok: true, data: { ...lead, assignedRepId: repId } };
  }

  // TODO(backend): PATCH /api/leads/{id} { assignedRepId }
  return notImplemented<Lead>("assignLeadToRep");
}

/** Add a note to a lead. */
export async function addNote(
  leadId: string,
  body: string,
  authorName: string,
): Promise<ApiResult<{ leadId: string; note: Note }>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(200);
    return {
      ok: true,
      data: {
        leadId,
        note: { id: localId("note"), body, authorName, daysAgo: 0 },
      },
    };
  }

  // TODO(backend): POST /api/leads/{leadId}/notes { body }
  //   The author comes from the session server-side — never trust a name sent
  //   by the client.
  return notImplemented<{ leadId: string; note: Note }>("addNote");
}

/** Record a call attempt. Appends activity and bumps the rep's dial count. */
export async function logCall(
  leadId: string,
): Promise<ApiResult<{ leadId: string; event: ActivityEvent }>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(200);

    // The WHOLE RECORD, not just its label.
    //
    // This returned `{ leadId, label }` and the store's reducer built the
    // event itself, keying the id off `activity.length` — so deleting one
    // entry and adding another would mint a duplicate React key, and the id
    // was invented in the one layer this codebase says must not invent them
    // (see the CACHE vs TRANSPORT note at the top of lib/store/crm-store.tsx).
    // A real API returns the created row; so does this.
    return {
      ok: true,
      data: {
        leadId,
        event: { id: localId("act"), label: "Dial attempt made", daysAgo: 0 },
      },
    };
  }

  // TODO(backend): POST /api/leads/{leadId}/calls — return the created
  // activity record, including the server-generated id and timestamp.
  return notImplemented<{ leadId: string; event: ActivityEvent }>("logCall");
}

/* ==========================================================================
   REPS
   ========================================================================== */

export interface NewRepInput {
  name: string;
  email: string;
  /**
   * Temporary password, only present when creating a rep WITH login access.
   *
   * TODO(backend): never log this, never store it in plaintext, and force a
   * change on first sign-in. Send it over HTTPS only.
   */
  password?: string;
}

/** Create a rep. `password` omitted = the "Quick Add (no login)" path. */
export async function createRep(input: NewRepInput): Promise<ApiResult<Rep>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(360);
    return {
      ok: true,
      data: {
        id: localId("rep"),
        name: input.name,
        email: input.email,
        role: "Sales Rep",
        // A brand new rep has done nothing yet, and every counter says so.
        // `dialsToday` is not optional on purpose: a missing figure would
        // render as "NaN" on the one card the rep is measured by.
        dials: 0,
        dialsToday: 0,
        appointments: 0,
        conversions: 0,
        active: true,
      },
    };
  }

  // TODO(backend): POST /api/reps
  //   Return 409 with field: "email" for a duplicate address.
  return notImplemented<Rep>("createRep");
}

/** Update a rep's editable fields. */
export async function updateRep(rep: Rep): Promise<ApiResult<Rep>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(220);
    return { ok: true, data: rep };
  }

  // TODO(backend): PATCH /api/reps/{id}
  return notImplemented<Rep>("updateRep");
}

/** Deactivate or reactivate a rep. Deactivated reps keep their history but
 *  drop out of assignment menus and the leaderboard. */
export async function setRepActive(
  rep: Rep,
  active: boolean,
): Promise<ApiResult<Rep>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(200);
    return { ok: true, data: { ...rep, active } };
  }

  // TODO(backend): PATCH /api/reps/{id} { active }
  return notImplemented<Rep>("setRepActive");
}

/** Permanently delete a rep. */
export async function deleteRep(id: string): Promise<ApiResult<string>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(220);
    return { ok: true, data: id };
  }

  // TODO(backend): DELETE /api/reps/{id}
  //   Decide what happens to leads assigned to them — reassign or orphan.
  return notImplemented<string>("deleteRep");
}

/* ==========================================================================
   PIPELINE STAGES
   ========================================================================== */

/** Rename a stage. The id must not change — leads reference it. */
export async function renameStage(
  id: string,
  label: string,
): Promise<ApiResult<{ id: string; label: string }>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(180);
    return { ok: true, data: { id, label } };
  }

  // TODO(backend): PATCH /api/stages/{id} { label }
  return notImplemented<{ id: string; label: string }>("renameStage");
}

/** Persist a new stage order. Sends the full ordered id list, not a delta,
 *  so a dropped request can never leave the order half-applied. */
export async function reorderStages(
  orderedIds: string[],
): Promise<ApiResult<string[]>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(180);
    return { ok: true, data: orderedIds };
  }

  // TODO(backend): PUT /api/stages/order { orderedIds }
  return notImplemented<string[]>("reorderStages");
}

/* ==========================================================================
   DELIVERY  —  everything the dev workspace writes
   --------------------------------------------------------------------------
   These are the write side of the client portal. Each one publishes something
   a client reads within seconds on /portal, which is why every function here
   returns the WHOLE updated lead rather than a fragment: the store applies it
   with `lead/updated` and every screen showing that record — the dev
   workspace, the admin lead detail, and the client's own dashboard — moves at
   the same time and cannot disagree.

   The role that may call these is `dev` (and `admin`). See the field-ownership
   table in config/roles.ts.
   ========================================================================== */

/**
 * Put the three-state milestone list back into a coherent shape.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * THE ONE RULE, AND WHY IT IS A RULE AND NOT A FIELD
 * ──────────────────────────────────────────────────────────────────────────
 * A developer sees a CHECKBOX per step: done, or not done. A client sees THREE
 * states: Complete, In progress, Not started. Rather than ask the developer to
 * maintain the middle one by hand — which is the version that goes stale in a
 * week, leaving a client reading "We're working on Design" a month after
 * Design shipped — it is DERIVED here after every edit:
 *
 *     the first step that is not done  ->  in_progress
 *     everything after it              ->  pending
 *     everything explicitly ticked     ->  done
 *
 * Call it after ANY change to the array: toggle, add, remove, reorder. It is
 * the only thing in the codebase that should ever write `status`.
 *
 * Consequences worth knowing:
 *   - ticking step 3 while step 2 is open leaves step 2 as the in-progress
 *     one, which is correct: that IS the work still outstanding
 *   - with every step done there is no in_progress, which is what
 *     `selectProjectProgress().launched` reads to say "your project is live"
 *   - reordering can move which step is in progress, and that is the point
 *
 * TODO(backend): reproduce this server-side. If the API lets a client of the
 * API set `status` directly, the two definitions drift and the portal starts
 * contradicting the workspace.
 */
export function normalizeMilestones(milestones: Milestone[]): Milestone[] {
  let foundOpen = false;

  return milestones.map((milestone) => {
    if (milestone.status === "done") return milestone;

    if (!foundOpen) {
      foundOpen = true;
      return { ...milestone, status: "in_progress" as const };
    }

    return { ...milestone, status: "pending" as const };
  });
}

/** Apply a delivery change to a lead and hand the whole record back. */
function applyToLead(lead: Lead, changes: Partial<Lead>): Lead {
  return { ...lead, ...changes };
}

export interface NewStepInput {
  label: string;
  /** ISO calendar date, or null. See `Milestone.targetDate` in lib/types.ts. */
  targetDate?: string | null;
}

/** Add a project step to the end of the list. */
export async function addMilestone(
  lead: Lead,
  input: NewStepInput,
): Promise<ApiResult<Lead>> {
  const label = input.label.trim();
  if (!label) {
    return { ok: false, message: "A step needs a name.", field: "label" };
  }

  if (!CRM_BACKEND_CONNECTED) {
    await delay(200);

    const milestone: Milestone = {
      id: localId("ms"),
      label,
      // Normalisation immediately below decides the real value. Starting at
      // "pending" rather than guessing keeps the rule in one place.
      status: "pending",
      targetDate: input.targetDate ?? null,
    };

    return {
      ok: true,
      data: applyToLead(lead, {
        milestones: normalizeMilestones([...lead.milestones, milestone]),
      }),
    };
  }

  // TODO(backend): POST /api/leads/{id}/milestones { label, targetDate }
  //   Return the updated lead, not just the new milestone — the whole point of
  //   normalizeMilestones() is that adding one step can change another.
  return notImplemented<Lead>("addMilestone");
}

/**
 * Change one step: tick it, rename it, or set its target date.
 *
 * One function for three edits because they all resolve to "replace this
 * milestone, then re-derive the list". Three endpoints would be three places
 * to forget the re-derive.
 */
export async function updateMilestone(
  lead: Lead,
  milestone: Milestone,
): Promise<ApiResult<Lead>> {
  const label = milestone.label.trim();
  if (!label) {
    return { ok: false, message: "A step needs a name.", field: "label" };
  }

  if (!CRM_BACKEND_CONNECTED) {
    await delay(160);

    return {
      ok: true,
      data: applyToLead(lead, {
        milestones: normalizeMilestones(
          lead.milestones.map((entry) =>
            entry.id === milestone.id ? { ...milestone, label } : entry,
          ),
        ),
      }),
    };
  }

  // TODO(backend): PATCH /api/leads/{id}/milestones/{milestoneId}
  return notImplemented<Lead>("updateMilestone");
}

/** Remove a step. The client's percentage changes as a result. */
export async function removeMilestone(
  lead: Lead,
  milestoneId: string,
): Promise<ApiResult<Lead>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(200);

    return {
      ok: true,
      data: applyToLead(lead, {
        milestones: normalizeMilestones(
          lead.milestones.filter((entry) => entry.id !== milestoneId),
        ),
      }),
    };
  }

  // TODO(backend): DELETE /api/leads/{id}/milestones/{milestoneId}
  return notImplemented<Lead>("removeMilestone");
}

/**
 * Persist a new step order.
 *
 * Takes the FULL ordered id list rather than a "moved from 2 to 4" delta, for
 * the same reason `reorderStages` does: a dropped request can then never leave
 * the order half-applied. Ids that are not in the list are dropped, and
 * unknown ids are ignored, so a stale client cannot corrupt the array.
 */
export async function reorderMilestones(
  lead: Lead,
  orderedIds: string[],
): Promise<ApiResult<Lead>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(160);

    const byId = new Map(lead.milestones.map((entry) => [entry.id, entry]));
    const reordered = orderedIds
      .map((id) => byId.get(id))
      .filter((entry): entry is Milestone => Boolean(entry));

    // A safety net, not a nicety: if the caller sent a short list, the missing
    // steps would silently vanish from the client's progress.
    if (reordered.length !== lead.milestones.length) {
      return {
        ok: false,
        message: "That reorder did not match the current steps. Reload and try again.",
      };
    }

    return {
      ok: true,
      data: applyToLead(lead, { milestones: normalizeMilestones(reordered) }),
    };
  }

  // TODO(backend): PUT /api/leads/{id}/milestones/order { orderedIds }
  return notImplemented<Lead>("reorderMilestones");
}

export interface NewPreviewInput {
  label: string;
  /** A data URL today, an object-storage URL once uploads are real. */
  imageUrl?: string | null;
  /** Where the client can open the working version. */
  url?: string | null;
  note?: string;
}

/**
 * Share a preview with the client.
 *
 * Newest first, because that is the order the portal reads and the order the
 * "Open preview" button picks from — the freshest link is the one a client
 * should land on.
 *
 * TODO(backend): `imageUrl` arrives here as a base64 data URL, which must NOT
 * go into a database column. Upload the file to object storage first (a signed
 * PUT from the browser is the cheap version) and store the resulting URL. A
 * client preview can show unreleased branding, so serve it from a signed,
 * expiring URL and never from a guessable path.
 */
export async function addPreview(
  lead: Lead,
  input: NewPreviewInput,
): Promise<ApiResult<Lead>> {
  const label = input.label.trim();
  if (!label) {
    return { ok: false, message: "Give it a label.", field: "label" };
  }
  if (!input.imageUrl && !input.url) {
    return { ok: false, message: "Add a screenshot or a link.", field: "url" };
  }

  if (!CRM_BACKEND_CONNECTED) {
    await delay(240);

    const preview: ProjectPreview = {
      id: localId("prev"),
      label,
      note: input.note?.trim() || undefined,
      imageUrl: input.imageUrl ?? null,
      url: input.url ?? null,
      updatedDaysAgo: 0,
    };

    return {
      ok: true,
      data: applyToLead(lead, { previews: [preview, ...lead.previews] }),
    };
  }

  // TODO(backend): POST /api/leads/{id}/previews
  return notImplemented<Lead>("addPreview");
}

/** Unshare a preview. It disappears from the client's dashboard. */
export async function removePreview(
  lead: Lead,
  previewId: string,
): Promise<ApiResult<Lead>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(200);

    return {
      ok: true,
      data: applyToLead(lead, {
        previews: lead.previews.filter((entry) => entry.id !== previewId),
      }),
    };
  }

  // TODO(backend): DELETE /api/leads/{id}/previews/{previewId}
  //   Delete the stored object too, or an unshared preview stays reachable by
  //   anyone who kept the URL.
  return notImplemented<Lead>("removePreview");
}

/**
 * Set or clear the public URL.
 *
 * `null` clears it, which turns the client's "Your live site" card back off.
 * That is a real action with a real consequence, so the UI confirms it — see
 * the live panel in the dev workspace.
 */
export async function setLiveUrl(
  lead: Lead,
  url: string | null,
): Promise<ApiResult<Lead>> {
  const trimmed = url?.trim() ?? "";

  if (trimmed && !/^https?:\/\/\S+\.\S+/i.test(trimmed)) {
    return {
      ok: false,
      message: "Enter a full link, starting with https://",
      field: "url",
    };
  }

  if (!CRM_BACKEND_CONNECTED) {
    await delay(220);
    return { ok: true, data: applyToLead(lead, { liveUrl: trimmed || null }) };
  }

  // TODO(backend): PATCH /api/leads/{id} { liveUrl }
  return notImplemented<Lead>("setLiveUrl");
}

export interface NewUpdateInput {
  title: string;
  body?: string;
}

/**
 * Post a note to the client's own updates feed.
 *
 * This is the write side of `lead.updates`, and it exists so the portal's
 * "Latest updates" panel is a living feed rather than whatever the seed put
 * there. It is deliberately NOT `lead.activity`: activity is the internal
 * sales timeline ("First dial attempt made") and is never shown to a client.
 * See the CLIENT-SAFE RULE in config/portal.ts.
 */
export async function addUpdate(
  lead: Lead,
  input: NewUpdateInput,
): Promise<ApiResult<Lead>> {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, message: "Write a headline first.", field: "title" };
  }

  if (!CRM_BACKEND_CONNECTED) {
    await delay(240);

    const update: ProjectUpdate = {
      id: localId("upd"),
      title,
      body: input.body?.trim() || undefined,
      daysAgo: 0,
    };

    return {
      ok: true,
      data: applyToLead(lead, { updates: [update, ...lead.updates] }),
    };
  }

  // TODO(backend): POST /api/leads/{id}/updates
  //   This is the one write here that should probably NOTIFY — a client who
  //   never opens the portal never sees it. Email is the obvious channel.
  return notImplemented<Lead>("addUpdate");
}

/* ==========================================================================
   CHAT
   ========================================================================== */

export async function sendMessage(
  threadId: string,
  body: string,
  authorName: string,
): Promise<
  ApiResult<{ threadId: string; id: string; body: string; timeLabel: string }>
> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(180);

    // Safe to build a timestamp here: this runs in a click handler, never
    // during render, so there is no server render to disagree with.
    const timeLabel = new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());

    return {
      ok: true,
      data: { threadId, id: localId("msg"), body, timeLabel },
    };
  }

  // TODO(backend): POST /api/threads/{threadId}/messages { body }
  //   Chat wants a live transport too — websocket or SSE — so other people's
  //   messages arrive without a refresh. This function only covers sending.
  void authorName;
  return notImplemented<{
    threadId: string;
    id: string;
    body: string;
    timeLabel: string;
  }>("sendMessage");
}

/* ==========================================================================
   INVOICES  (read-only in the UI today; here so the type is claimed)
   ========================================================================== */

export async function updateInvoiceStatus(
  invoice: Invoice,
  status: Invoice["status"],
): Promise<ApiResult<Invoice>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(200);
    return { ok: true, data: { ...invoice, status } };
  }

  // TODO(backend): PATCH /api/invoices/{id} { status }
  return notImplemented<Invoice>("updateInvoiceStatus");
}
