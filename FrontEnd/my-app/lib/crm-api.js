/**
 * CRM API BOUNDARY — BACKEND DEVELOPERS: THIS IS THE FILE YOU EDIT
 *
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
 *
 *  The milestone/preview/live-URL functions below are ALREADY wired to the
 *  real backend, ahead of the full flip above — the dev workspace's project
 *  data no longer lives only in this browser's localStorage.
 */
import { pipelineConfig } from "@/config/pipeline";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
/**
 * Flip to `true` once the TODO blocks below actually call your backend.
 *
 * While it is `false` every function returns mock records and the console runs
 * on sample data held in the browser. While it is `true` the unimplemented
 * functions fail loudly rather than quietly serving fake data that looks real.
 */
const CRM_BACKEND_CONNECTED = false;
/** Keeps pending states visible while the stub is in place. Delete with the mocks. */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** Guard for the connected-but-unimplemented case. Better a loud failure than
 *  a dashboard quietly showing invented numbers to the agency. */
function notImplemented(name) {
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
function localId(prefix) {
    const unique = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${unique}`;
}
/** Delete a lead. Resolves with the id so the store knows what to drop. */
export async function deleteLead(id) {
    if (!CRM_BACKEND_CONNECTED) {
        await delay(220);
        return { ok: true, data: id };
    }
    // TODO(backend): DELETE /api/leads/{id}
    //   A 404 here is usually harmless (someone else already deleted it) — treat
    //   it as success so the row still disappears from this user's screen.
    return notImplemented("deleteLead");
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
export async function restoreLead(lead) {
    if (!CRM_BACKEND_CONNECTED) {
        await delay(160);
        return { ok: true, data: lead };
    }
    // TODO(backend): POST /api/leads/{id}/restore
    return notImplemented("restoreLead");
}
/**
 * Move a lead to another stage. Called by the kanban drag, the stage select on
 * the lead detail page, and "Convert to Client".
 *
 * Returns the updated lead so the store never has to guess what the server did
 * — a real backend also stamps the stage-change time and may append its own
 * activity entry.
 */
export async function moveLeadToStage(lead, stageId) {
    if (!CRM_BACKEND_CONNECTED) {
        await delay(160);
        const stage = pipelineConfig.stages.find((entry) => entry.id === stageId);
        return {
            ok: true,
            data: Object.assign(Object.assign({}, lead), { stageId, daysInStage: 0, activity: [
                    ...lead.activity,
                    {
                        id: localId("act"),
                        label: `Moved to ${stage?.label ?? stageId}`,
                        daysAgo: 0,
                    },
                ] }),
        };
    }
    // TODO(backend): PATCH /api/leads/{id} { stageId }
    return notImplemented("moveLeadToStage");
}
export async function assignLeadToRep(lead, repId) {
    if (!CRM_BACKEND_CONNECTED) {
        await delay(160);
        return { ok: true, data: Object.assign(Object.assign({}, lead), { assignedRepId: repId }) };
    }
    // TODO(backend): PATCH /api/leads/{id} { assignedRepId }
    return notImplemented("assignLeadToRep");
}
export async function addNote(leadId, body, authorName) {
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
    return notImplemented("addNote");
}
/** Record a call attempt. Appends activity and bumps the rep's dial count. */
export async function logCall(leadId) {
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
    return notImplemented("logCall");
}
// PIPELINE STAGES
/** Rename a stage. The id must not change — leads reference it. */
export async function renameStage(id, label) {
    if (!CRM_BACKEND_CONNECTED) {
        await delay(180);
        return { ok: true, data: { id, label } };
    }
    // TODO(backend): PATCH /api/stages/{id} { label }
    return notImplemented("renameStage");
}
/** Persist a new stage order. Sends the full ordered id list, not a delta,
 *  so a dropped request can never leave the order half-applied. */
export async function reorderStages(orderedIds) {
    if (!CRM_BACKEND_CONNECTED) {
        await delay(180);
        return { ok: true, data: orderedIds };
    }
    // TODO(backend): PUT /api/stages/order { orderedIds }
    return notImplemented("reorderStages");
}
/* DELIVERY — everything the dev workspace writes
   These are the write side of the client portal. Each one publishes something
   a client reads within seconds on /portal, which is why every function here
   returns the WHOLE updated lead rather than a fragment: the store applies it
   with `lead/updated` and every screen showing that record — the dev
   workspace, the admin lead detail, and the client's own dashboard — moves at
   the same time and cannot disagree.

   The role that may call these is `dev` (and `admin`). See the field-ownership
   table in config/roles.ts. */
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
export function normalizeMilestones(milestones) {
    let foundOpen = false;
    return milestones.map((milestone) => {
        if (milestone.status === "done")
            return milestone;
        if (!foundOpen) {
            foundOpen = true;
            return Object.assign(Object.assign({}, milestone), { status: "in_progress" });
        }
        return Object.assign(Object.assign({}, milestone), { status: "pending" });
    });
}
/** Apply a delivery change to a lead and hand the whole record back. */
function applyToLead(lead, changes) {
    return Object.assign(Object.assign({}, lead), changes);
}
/**
 * MILESTONES, PREVIEWS AND LIVE URL ARE REAL NOW — ahead of the rest of this
 * file. The backend re-derives `status` the same way normalizeMilestones()
 * above does (see ProjectController::normalizeStatuses), so these functions
 * only translate this shape to/from Laravel's and never compute it locally.
 */
/** A Laravel LeadMilestone row -> the shape every component here expects. */
function mapMilestone(m) {
    return { id: String(m.id), label: m.label, status: m.status, targetDate: m.target_date };
}
/** A Laravel LeadPreview row -> the shape every component here expects. */
function mapPreview(p) {
    const updatedDaysAgo = p.updated_at
        ? Math.max(0, Math.floor((Date.now() - new Date(p.updated_at).getTime()) / 86400000))
        : 0;
    return {
        id: String(p.id),
        label: p.label,
        note: p.note ?? undefined,
        imageUrl: p.image_url ?? null,
        url: p.url ?? null,
        updatedDaysAgo,
    };
}
/** A lead as returned by GET /api/leads/{id} -> the delivery fields
 *  ensureProject() seeds the mock store with. Shared with crm-store.jsx so
 *  a dev opening a project (or refreshing the page) always shows real data. */
export function mapProjectFields(realLead) {
    return {
        milestones: (realLead.milestones ?? []).map(mapMilestone),
        previews: (realLead.previews ?? []).map(mapPreview),
        liveUrl: realLead.live_url ?? null,
    };
}
/** Add a project step to the end of the list. */
export async function addMilestone(lead, input) {
    const label = input.label.trim();
    if (!label) {
        return { ok: false, message: "A step needs a name.", field: "label" };
    }
    try {
        const { data } = await api.post(`/api/leads/${lead.id}/milestones`, {
            label,
            target_date: input.targetDate ?? null,
        });
        return { ok: true, data: applyToLead(lead, { milestones: data.milestones.map(mapMilestone) }) };
    } catch (error) {
        return { ok: false, message: getErrorMessage(error) };
    }
}
/**
 * Change one step: tick it, rename it, or set its target date.
 *
 * One function for three edits because they all resolve to "replace this
 * milestone, then re-derive the list". Three endpoints would be three places
 * to forget the re-derive.
 */
export async function updateMilestone(lead, milestone) {
    const label = milestone.label.trim();
    if (!label) {
        return { ok: false, message: "A step needs a name.", field: "label" };
    }
    try {
        const { data } = await api.patch(`/api/leads/${lead.id}/milestones/${milestone.id}`, {
            label,
            target_date: milestone.targetDate ?? null,
            // The server only ever accepts done/pending (the checkbox) and
            // re-derives in_progress itself — see mapProjectFields's note.
            status: milestone.status === "done" ? "done" : "pending",
        });
        return { ok: true, data: applyToLead(lead, { milestones: data.milestones.map(mapMilestone) }) };
    } catch (error) {
        return { ok: false, message: getErrorMessage(error) };
    }
}
/** Remove a step. The client's percentage changes as a result. */
export async function removeMilestone(lead, milestoneId) {
    try {
        const { data } = await api.delete(`/api/leads/${lead.id}/milestones/${milestoneId}`);
        return { ok: true, data: applyToLead(lead, { milestones: data.milestones.map(mapMilestone) }) };
    } catch (error) {
        return { ok: false, message: getErrorMessage(error) };
    }
}
/**
 * Persist a new step order.
 *
 * Takes the FULL ordered id list rather than a "moved from 2 to 4" delta, for
 * the same reason `reorderStages` does: a dropped request can then never leave
 * the order half-applied. Ids that are not in the list are dropped, and
 * unknown ids are ignored, so a stale client cannot corrupt the array.
 */
export async function reorderMilestones(lead, orderedIds) {
    try {
        const { data } = await api.patch(`/api/leads/${lead.id}/milestones/reorder`, {
            ids: orderedIds.map(Number),
        });
        return { ok: true, data: applyToLead(lead, { milestones: data.milestones.map(mapMilestone) }) };
    } catch (error) {
        return { ok: false, message: getErrorMessage(error) };
    }
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
export async function addPreview(lead, input) {
    const label = input.label.trim();
    if (!label) {
        return { ok: false, message: "Give it a label.", field: "label" };
    }
    if (!input.imageUrl && !input.url) {
        return { ok: false, message: "Add a screenshot or a link.", field: "url" };
    }
    try {
        // The screenshot arrives here as a base64 data URL (lib/image-upload.js
        // already downsized/encoded it) — the server decodes it to a real file.
        const { data } = await api.post(`/api/leads/${lead.id}/previews`, {
            label,
            note: input.note?.trim() || null,
            url: input.url ?? null,
            image_data_url: input.imageUrl ?? null,
        });
        return { ok: true, data: applyToLead(lead, { previews: data.previews.map(mapPreview) }) };
    } catch (error) {
        return { ok: false, message: getErrorMessage(error) };
    }
}
/** Unshare a preview. It disappears from the client's dashboard — the
 *  server deletes the stored file too. */
export async function removePreview(lead, previewId) {
    try {
        const { data } = await api.delete(`/api/leads/${lead.id}/previews/${previewId}`);
        return { ok: true, data: applyToLead(lead, { previews: data.previews.map(mapPreview) }) };
    } catch (error) {
        return { ok: false, message: getErrorMessage(error) };
    }
}
/**
 * Set or clear the public URL.
 *
 * `null` clears it, which turns the client's "Your live site" card back off.
 * That is a real action with a real consequence, so the UI confirms it — see
 * the live panel in the dev workspace.
 */
export async function setLiveUrl(lead, url) {
    const trimmed = url?.trim() ?? "";
    if (trimmed && !/^https?:\/\/\S+\.\S+/i.test(trimmed)) {
        return {
            ok: false,
            message: "Enter a full link, starting with https://",
            field: "url",
        };
    }
    try {
        const { data } = await api.patch(`/api/leads/${lead.id}/live-url`, { live_url: trimmed || null });
        return { ok: true, data: applyToLead(lead, { liveUrl: data.live_url }) };
    } catch (error) {
        return { ok: false, message: getErrorMessage(error) };
    }
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
export async function addUpdate(lead, input) {
    const title = input.title.trim();
    if (!title) {
        return { ok: false, message: "Write a headline first.", field: "title" };
    }
    if (!CRM_BACKEND_CONNECTED) {
        await delay(240);
        const update = {
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
    return notImplemented("addUpdate");
}
// CHAT
export async function sendMessage(threadId, body, authorName) {
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
    return notImplemented("sendMessage");
}
// INVOICES (read-only in the UI today; here so the type is claimed)
export async function updateInvoiceStatus(invoice, status) {
    if (!CRM_BACKEND_CONNECTED) {
        await delay(200);
        return { ok: true, data: Object.assign(Object.assign({}, invoice), { status }) };
    }
    // TODO(backend): PATCH /api/invoices/{id} { status }
    return notImplemented("updateInvoiceStatus");
}
