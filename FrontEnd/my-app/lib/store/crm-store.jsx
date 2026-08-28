"use client";
/**
 * ============================================================================
 *  CRM STORE
 * ============================================================================
 *  The console's client-side cache. Components read state from `useCrm()` and
 *  call its actions; the actions go through lib/crm-api.ts and apply whatever
 *  comes back.
 *
 *  WHY A CACHE AND A TRANSPORT, RATHER THAN ONE THING
 *  This mirrors how the app will work once the API is real: crm-api.ts produces
 *  records (from a fetch), the store holds them. That means connecting the
 *  backend does not restructure anything here — the reducer keeps applying the
 *  same shapes, they just arrive from the network instead of from a mock.
 *
 *  TODO(backend): once the API is live, consider replacing this file with a
 *  data-fetching library (TanStack Query, SWR) rather than growing it. The
 *  action signatures below are intentionally close to a mutation API so that
 *  swap stays cheap.
 * ============================================================================
 */
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, } from "react";
import { toast } from "sonner";
import * as crmApi from "@/lib/crm-api";
import { useSession } from "@/components/console/session-provider";
import { consoleConfig } from "@/config/console";
import { createSeedState } from "@/lib/mock/seed";
import { clearPersistedState, readPersistedState, writePersistedState, } from "@/lib/store/persistence";
import { selectSessionUser } from "@/lib/store/selectors";
function reducer(state, action) {
    switch (action.type) {
        case "hydrate":
            return Object.assign(Object.assign({}, action.state), { hydrated: true });
        case "reset":
            return Object.assign(Object.assign({}, createSeedState()), { hydrated: true });
        // A dev's project list is real leads now (LeadController's developer
        // scoping), but step/preview/live-URL tracking is deliberately still
        // local-only (see config/dev.js) — no backend for it exists yet. This
        // lazily gives a real lead a local delivery record, keyed by its real
        // id, the first time a dev opens it, so the existing mock-backed
        // StepList/PreviewManager/LiveSitePanel/UpdateComposer keep working
        // unchanged and the client portal (reading the same `state.leads`)
        // can still show progress for that id. A no-op if one already exists.
        case "project/ensured":
            if (state.leads.some((lead) => lead.id === action.lead.id))
                return state;
            return Object.assign(Object.assign({}, state), { leads: [...state.leads, action.lead] });
        case "lead/updated":
            return Object.assign(Object.assign({}, state), { leads: state.leads.map((lead) => lead.id === action.lead.id ? action.lead : lead) });
        case "lead/removed":
            return Object.assign(Object.assign({}, state), { leads: state.leads.filter((lead) => lead.id !== action.id) });
        case "lead/restored": {
            // Undo puts the record back WHERE IT WAS, not at the top. Restoring to
            // the front would leave the list visibly reordered after an action whose
            // entire promise is that nothing changed — the user would have to
            // check whether anything else moved too.
            const leads = state.leads.slice();
            leads.splice(Math.min(action.index, leads.length), 0, action.lead);
            return Object.assign(Object.assign({}, state), { leads });
        }
        case "lead/noteAdded":
            return Object.assign(Object.assign({}, state), { leads: state.leads.map((lead) => lead.id === action.leadId
                    ? Object.assign(Object.assign({}, lead), { notes: [action.note, ...lead.notes] }) : lead) });
        case "lead/activityAdded":
            // The event arrives fully formed from the API. The reducer used to build
            // it here and key the id off `activity.length`, which mints a duplicate
            // the moment anything is ever removed — and puts id generation in the
            // CACHE, which the note at the top of this file says is the transport's
            // job. See logCall() in lib/crm-api.ts.
            return Object.assign(Object.assign({}, state), { leads: state.leads.map((lead) => lead.id === action.leadId
                    ? Object.assign(Object.assign({}, lead), { activity: [...lead.activity, action.event] }) : lead) });
        case "stage/renamed":
            return Object.assign(Object.assign({}, state), { stageOrder: state.stageOrder.map((stage) => stage.id === action.id ? Object.assign(Object.assign({}, stage), { label: action.label }) : stage) });
        case "stage/reordered":
            return Object.assign(Object.assign({}, state), { stageOrder: action.orderedIds
                    .map((id) => state.stageOrder.find((stage) => stage.id === id))
                    .filter((stage) => Boolean(stage)) });
        case "chat/messageAdded":
            return Object.assign(Object.assign({}, state), { threads: state.threads.map((thread) => thread.id === action.threadId
                    ? Object.assign(Object.assign({}, thread), { messages: [...thread.messages, action.message] }) : thread) });
        default:
            return state;
    }
}
const CrmContext = createContext(null);
export function CrmProvider({ children }) {
    const session = useSession();
    // The server and the FIRST client render both use the seed, so the markup
    // matches and hydration is clean. Persisted state is swapped in immediately
    // afterwards, in an effect — reading localStorage during render would produce
    // different HTML on the client than the server sent.
    const [state, dispatch] = useReducer(reducer, undefined, createSeedState);
    useEffect(() => {
        const saved = readPersistedState();
        if (saved)
            dispatch({ type: "hydrate", state: saved });
        else
            dispatch({ type: "hydrate", state: createSeedState() });
    }, []);
    // Persist after every change, but never before hydration — writing the seed
    // over a user's saved state during the first render would wipe their data on
    // every page load.
    const hydratedOnce = useRef(false);
    /** So a full disk warns once, not on every keystroke afterwards. */
    const storageWarned = useRef(false);
    useEffect(() => {
        if (!state.hydrated)
            return;
        if (!hydratedOnce.current) {
            hydratedOnce.current = true;
            return;
        }
        const saved = writePersistedState(state);
        // A silent failure here is the worst outcome in the whole store: the
        // console goes on working perfectly and simply stops remembering, which
        // looks like random data loss an hour later. Since the dev workspace can
        // store screenshots, running out of quota is a realistic thing to do
        // rather than a theoretical one.
        if (!saved && !storageWarned.current) {
            storageWarned.current = true;
            toast.error(consoleConfig.content.storageFullTitle, {
                description: consoleConfig.content.storageFullBody,
                duration: Infinity,
            });
        }
    }, [state]);
    /**
     * Whose name goes on a note or a message.
     *
     * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
     * It was the literal string "You" for both. That is correct for the person
     * typing and wrong for everyone else who opens the same record, and with
     * four fronts reading one database it broke two things outright:
     *
     *   - a note written by a rep read "You" in their manager's console
     *   - a message a rep sent was stored with authorName "You", so
     *     `messagesForViewer()` — which matches the author against the reader —
     *     rendered the rep's OWN message as the manager's, on the one screen
     *     whose job is telling the two apart
     *
     * `selectSessionUser` resolves the display name for whichever role is signed
     * in, so a note is attributed to the person who actually wrote it.
     *
     * TODO(backend): send the author's ID, not their name. The server knows who
     * is calling from the session and should stamp the record itself — a
     * client-supplied author is a client-supplied lie waiting to happen, and two
     * people with the same display name break every comparison downstream.
     */
    const authorName = selectSessionUser(state, session).name;
    const actions = useMemo(() => ({
        async deleteLead(id) {
            const result = await crmApi.deleteLead(id);
            if (result.ok)
                dispatch({ type: "lead/removed", id: result.data });
            return result;
        },
        async restoreLead(lead, index) {
            const result = await crmApi.restoreLead(lead);
            if (result.ok) {
                dispatch({ type: "lead/restored", lead: result.data, index });
            }
            return result;
        },
        async moveLead(lead, stageId) {
            const result = await crmApi.moveLeadToStage(lead, stageId);
            if (result.ok)
                dispatch({ type: "lead/updated", lead: result.data });
            return result;
        },
        async assignLead(lead, repId) {
            const result = await crmApi.assignLeadToRep(lead, repId);
            if (result.ok)
                dispatch({ type: "lead/updated", lead: result.data });
            return result;
        },
        async addNote(leadId, body) {
            const result = await crmApi.addNote(leadId, body, authorName);
            if (result.ok) {
                dispatch({
                    type: "lead/noteAdded",
                    leadId: result.data.leadId,
                    note: result.data.note,
                });
            }
            return result;
        },
        async logCall(leadId) {
            const result = await crmApi.logCall(leadId);
            if (result.ok) {
                dispatch({
                    type: "lead/activityAdded",
                    leadId: result.data.leadId,
                    event: result.data.event,
                });
            }
            return result;
        },
        async renameStage(id, label) {
            const result = await crmApi.renameStage(id, label);
            if (result.ok) {
                dispatch({
                    type: "stage/renamed",
                    id: result.data.id,
                    label: result.data.label,
                });
            }
            return result;
        },
        async reorderStages(orderedIds) {
            const result = await crmApi.reorderStages(orderedIds);
            if (result.ok) {
                dispatch({ type: "stage/reordered", orderedIds: result.data });
            }
            return result;
        },
        async sendMessage(threadId, body) {
            const result = await crmApi.sendMessage(threadId, body, authorName);
            if (result.ok) {
                dispatch({
                    type: "chat/messageAdded",
                    threadId: result.data.threadId,
                    message: {
                        id: result.data.id,
                        // The real name, so the OTHER side of the thread attributes it
                        // correctly — and so `messagesForViewer()` can recognise it as
                        // the sender's own on the way back.
                        authorName,
                        body: result.data.body,
                        timeLabel: result.data.timeLabel,
                        // Stored for the sender's immediate render; every reader
                        // re-derives it. See messagesForViewer() in selectors.ts.
                        fromMe: true,
                    },
                });
            }
            return result;
        },
        /* -------------------------------------------------------------------
           DELIVERY
  
           All eight follow one shape: call the API, and if it succeeds apply the
           returned record with `lead/updated`. No new reducer cases, because
           there is nothing new to reduce — the API hands back a whole lead, the
           same as moveLead and assignLead already do.
           ------------------------------------------------------------------- */
        async addStep(lead, input) {
            const result = await crmApi.addMilestone(lead, input);
            if (result.ok)
                dispatch({ type: "lead/updated", lead: result.data });
            return result;
        },
        async saveStep(lead, step) {
            const result = await crmApi.updateMilestone(lead, step);
            if (result.ok)
                dispatch({ type: "lead/updated", lead: result.data });
            return result;
        },
        async removeStep(lead, stepId) {
            const result = await crmApi.removeMilestone(lead, stepId);
            if (result.ok)
                dispatch({ type: "lead/updated", lead: result.data });
            return result;
        },
        async reorderSteps(lead, orderedIds) {
            const result = await crmApi.reorderMilestones(lead, orderedIds);
            if (result.ok)
                dispatch({ type: "lead/updated", lead: result.data });
            return result;
        },
        async addPreview(lead, input) {
            const result = await crmApi.addPreview(lead, input);
            if (result.ok)
                dispatch({ type: "lead/updated", lead: result.data });
            return result;
        },
        async removePreview(lead, previewId) {
            const result = await crmApi.removePreview(lead, previewId);
            if (result.ok)
                dispatch({ type: "lead/updated", lead: result.data });
            return result;
        },
        async setLiveUrl(lead, url) {
            const result = await crmApi.setLiveUrl(lead, url);
            if (result.ok)
                dispatch({ type: "lead/updated", lead: result.data });
            return result;
        },
        async postUpdate(lead, input) {
            const result = await crmApi.addUpdate(lead, input);
            if (result.ok)
                dispatch({ type: "lead/updated", lead: result.data });
            return result;
        },
        /** See "project/ensured" above — sync, local-only, no API call. */
        ensureProject({ id, name, company, projectSummary = null }) {
            dispatch({
                type: "project/ensured",
                lead: {
                    id,
                    name,
                    company,
                    phone: null,
                    email: null,
                    source: null,
                    stageId: null,
                    assignedRepId: null,
                    daysInStage: 0,
                    createdDaysAgo: 0,
                    notes: [],
                    activity: [],
                    milestones: [],
                    files: [],
                    invoices: [],
                    projectSummary,
                    previews: [],
                    liveUrl: null,
                    updates: [],
                },
            });
        },
        resetDemoData() {
            clearPersistedState();
            dispatch({ type: "reset" });
        },
    }), 
    // Rebuilt when the signed-in person changes, which happens once per
    // session. Everything else in here is dispatch-only and stable.
    [authorName]);
    const value = useMemo(() => ({ state, actions }), [state, actions]);
    return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}
/**
 * Read the console state and actions.
 *
 * Throws outside the provider rather than returning undefined, so the mistake
 * surfaces as a clear message at the component that made it instead of a
 * "cannot read property of null" three frames deeper.
 */
export function useCrm() {
    const context = useContext(CrmContext);
    if (!context) {
        throw new Error("useCrm() must be used inside <CrmProvider>.");
    }
    return context;
}
