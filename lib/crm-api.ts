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
import type { Invoice, Lead, Note, Rep } from "@/lib/types";

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
  source: string;
  note: string;
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
      source: input.source,
      // A record created from the Clients screen is a paying client by
      // definition — that is what the screen lists.
      stageId: pipelineConfig.wonStageId,
      assignedRepId: null,
      daysInStage: 0,
      // Created just now, so it falls inside every Reports date range.
      createdDaysAgo: 0,
      notes: input.note
        ? [{ id: localId("note"), body: input.note, authorName: "You", daysAgo: 0 }]
        : [],
      activity: [{ id: localId("act"), label: "Lead created", daysAgo: 0 }],
      milestones: [],
      files: [],
      invoices: [],
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
): Promise<ApiResult<{ leadId: string; label: string }>> {
  if (!CRM_BACKEND_CONNECTED) {
    await delay(200);
    return { ok: true, data: { leadId, label: "Dial attempt made" } };
  }

  // TODO(backend): POST /api/leads/{leadId}/calls
  return notImplemented<{ leadId: string; label: string }>("logCall");
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
        dials: 0,
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
