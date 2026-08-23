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

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

import { toast } from "sonner";

import * as crmApi from "@/lib/crm-api";
import { useSession } from "@/components/console/session-provider";
import { consoleConfig } from "@/config/console";
import { createSeedState } from "@/lib/mock/seed";
import {
  clearPersistedState,
  readPersistedState,
  writePersistedState,
} from "@/lib/store/persistence";
import { selectSessionUser } from "@/lib/store/selectors";
import type {
  ActivityEvent as ActivityEventInput,
  ChatMessage,
  CrmState,
  Lead,
  Milestone,
  Rep,
} from "@/lib/types";

/* --------------------------------------------------------------------------
   Actions
   -------------------------------------------------------------------------- */

type CrmAction =
  | { type: "hydrate"; state: Omit<CrmState, "hydrated"> }
  | { type: "reset" }
  | { type: "lead/added"; lead: Lead }
  | { type: "lead/updated"; lead: Lead }
  | { type: "lead/removed"; id: string }
  | { type: "lead/restored"; lead: Lead; index: number }
  | { type: "lead/noteAdded"; leadId: string; note: Lead["notes"][number] }
  | { type: "lead/activityAdded"; leadId: string; event: ActivityEventInput }
  | { type: "rep/added"; rep: Rep }
  | { type: "rep/updated"; rep: Rep }
  | { type: "rep/removed"; id: string }
  | { type: "stage/renamed"; id: string; label: string }
  | { type: "stage/reordered"; orderedIds: string[] }
  | { type: "chat/messageAdded"; threadId: string; message: ChatMessage };

function reducer(state: CrmState, action: CrmAction): CrmState {
  switch (action.type) {
    case "hydrate":
      return { ...action.state, hydrated: true };

    case "reset":
      return { ...createSeedState(), hydrated: true };

    case "lead/added":
      // Newest first, so a client added from the dialog appears at the top of
      // the table where the user is looking, not buried on page four.
      return { ...state, leads: [action.lead, ...state.leads] };

    case "lead/updated":
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.lead.id ? action.lead : lead,
        ),
      };

    case "lead/removed":
      return {
        ...state,
        leads: state.leads.filter((lead) => lead.id !== action.id),
      };

    case "lead/restored": {
      // Undo puts the record back WHERE IT WAS, not at the top. Restoring to
      // the front would leave the list visibly reordered after an action whose
      // entire promise is that nothing changed — the user would have to
      // check whether anything else moved too.
      const leads = state.leads.slice();
      leads.splice(Math.min(action.index, leads.length), 0, action.lead);
      return { ...state, leads };
    }

    case "lead/noteAdded":
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.leadId
            ? { ...lead, notes: [action.note, ...lead.notes] }
            : lead,
        ),
      };

    case "lead/activityAdded":
      // The event arrives fully formed from the API. The reducer used to build
      // it here and key the id off `activity.length`, which mints a duplicate
      // the moment anything is ever removed — and puts id generation in the
      // CACHE, which the note at the top of this file says is the transport's
      // job. See logCall() in lib/crm-api.ts.
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.leadId
            ? { ...lead, activity: [...lead.activity, action.event] }
            : lead,
        ),
      };

    case "rep/added":
      return { ...state, reps: [...state.reps, action.rep] };

    case "rep/updated":
      return {
        ...state,
        reps: state.reps.map((rep) =>
          rep.id === action.rep.id ? action.rep : rep,
        ),
      };

    case "rep/removed":
      return {
        ...state,
        reps: state.reps.filter((rep) => rep.id !== action.id),
        // Leads keep their history but lose the assignment, rather than
        // pointing at a rep that no longer exists.
        leads: state.leads.map((lead) =>
          lead.assignedRepId === action.id
            ? { ...lead, assignedRepId: null }
            : lead,
        ),
      };

    case "stage/renamed":
      return {
        ...state,
        stageOrder: state.stageOrder.map((stage) =>
          stage.id === action.id ? { ...stage, label: action.label } : stage,
        ),
      };

    case "stage/reordered":
      return {
        ...state,
        stageOrder: action.orderedIds
          .map((id) => state.stageOrder.find((stage) => stage.id === id))
          .filter((stage): stage is CrmState["stageOrder"][number] =>
            Boolean(stage),
          ),
      };

    case "chat/messageAdded":
      return {
        ...state,
        threads: state.threads.map((thread) =>
          thread.id === action.threadId
            ? { ...thread, messages: [...thread.messages, action.message] }
            : thread,
        ),
      };

    default:
      return state;
  }
}

/* --------------------------------------------------------------------------
   Context
   -------------------------------------------------------------------------- */

interface CrmContextValue {
  state: CrmState;
  actions: {
    addClient: (input: crmApi.NewClientInput) => Promise<crmApi.ApiResult<Lead>>;
    deleteLead: (id: string) => Promise<crmApi.ApiResult<string>>;
    /** Undo of a delete. `index` is the position the lead held before it went. */
    restoreLead: (lead: Lead, index: number) => Promise<crmApi.ApiResult<Lead>>;
    moveLead: (lead: Lead, stageId: string) => Promise<crmApi.ApiResult<Lead>>;
    assignLead: (
      lead: Lead,
      repId: string | null,
    ) => Promise<crmApi.ApiResult<Lead>>;
    addNote: (
      leadId: string,
      body: string,
    ) => Promise<crmApi.ApiResult<{ leadId: string; note: Lead["notes"][number] }>>;
    logCall: (
      leadId: string,
    ) => Promise<crmApi.ApiResult<{ leadId: string; event: ActivityEventInput }>>;
    addRep: (input: crmApi.NewRepInput) => Promise<crmApi.ApiResult<Rep>>;
    saveRep: (rep: Rep) => Promise<crmApi.ApiResult<Rep>>;
    setRepActive: (rep: Rep, active: boolean) => Promise<crmApi.ApiResult<Rep>>;
    deleteRep: (id: string) => Promise<crmApi.ApiResult<string>>;
    renameStage: (
      id: string,
      label: string,
    ) => Promise<crmApi.ApiResult<{ id: string; label: string }>>;
    reorderStages: (
      orderedIds: string[],
    ) => Promise<crmApi.ApiResult<string[]>>;
    sendMessage: (
      threadId: string,
      body: string,
    ) => Promise<
      crmApi.ApiResult<{
        threadId: string;
        id: string;
        body: string;
        timeLabel: string;
      }>
    >;

    /* ---------------------------------------------------------------------
       DELIVERY — what the dev workspace writes, and the client portal reads.

       Every one of these takes the whole `Lead` rather than an id, because the
       API functions behind them return a complete updated record: that is what
       lets one write move the workspace, the admin lead detail and the
       client's dashboard together. See the DELIVERY block in lib/crm-api.ts.
       --------------------------------------------------------------------- */

    addStep: (
      lead: Lead,
      input: crmApi.NewStepInput,
    ) => Promise<crmApi.ApiResult<Lead>>;
    /** Tick, rename, or set a target date — all one write. */
    saveStep: (lead: Lead, step: Milestone) => Promise<crmApi.ApiResult<Lead>>;
    removeStep: (lead: Lead, stepId: string) => Promise<crmApi.ApiResult<Lead>>;
    reorderSteps: (
      lead: Lead,
      orderedIds: string[],
    ) => Promise<crmApi.ApiResult<Lead>>;

    addPreview: (
      lead: Lead,
      input: crmApi.NewPreviewInput,
    ) => Promise<crmApi.ApiResult<Lead>>;
    removePreview: (
      lead: Lead,
      previewId: string,
    ) => Promise<crmApi.ApiResult<Lead>>;

    /** `null` clears it and turns the client's live-site card back off. */
    setLiveUrl: (
      lead: Lead,
      url: string | null,
    ) => Promise<crmApi.ApiResult<Lead>>;

    postUpdate: (
      lead: Lead,
      input: crmApi.NewUpdateInput,
    ) => Promise<crmApi.ApiResult<Lead>>;

    /** Wipe local changes and reseed. Backs the "Reset demo data" control. */
    resetDemoData: () => void;
  };
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const session = useSession();

  // The server and the FIRST client render both use the seed, so the markup
  // matches and hydration is clean. Persisted state is swapped in immediately
  // afterwards, in an effect — reading localStorage during render would produce
  // different HTML on the client than the server sent.
  const [state, dispatch] = useReducer(reducer, undefined, createSeedState);

  useEffect(() => {
    const saved = readPersistedState();
    if (saved) dispatch({ type: "hydrate", state: saved });
    else dispatch({ type: "hydrate", state: createSeedState() });
  }, []);

  // Persist after every change, but never before hydration — writing the seed
  // over a user's saved state during the first render would wipe their data on
  // every page load.
  const hydratedOnce = useRef(false);
  /** So a full disk warns once, not on every keystroke afterwards. */
  const storageWarned = useRef(false);

  useEffect(() => {
    if (!state.hydrated) return;
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

  const actions = useMemo<CrmContextValue["actions"]>(
    () => ({
      async addClient(input) {
        const result = await crmApi.createClient({ authorName, ...input });
        if (result.ok) dispatch({ type: "lead/added", lead: result.data });
        return result;
      },

      async deleteLead(id) {
        const result = await crmApi.deleteLead(id);
        if (result.ok) dispatch({ type: "lead/removed", id: result.data });
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
        if (result.ok) dispatch({ type: "lead/updated", lead: result.data });
        return result;
      },

      async assignLead(lead, repId) {
        const result = await crmApi.assignLeadToRep(lead, repId);
        if (result.ok) dispatch({ type: "lead/updated", lead: result.data });
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

      async addRep(input) {
        const result = await crmApi.createRep(input);
        if (result.ok) dispatch({ type: "rep/added", rep: result.data });
        return result;
      },

      async saveRep(rep) {
        const result = await crmApi.updateRep(rep);
        if (result.ok) dispatch({ type: "rep/updated", rep: result.data });
        return result;
      },

      async setRepActive(rep, active) {
        const result = await crmApi.setRepActive(rep, active);
        if (result.ok) dispatch({ type: "rep/updated", rep: result.data });
        return result;
      },

      async deleteRep(id) {
        const result = await crmApi.deleteRep(id);
        if (result.ok) dispatch({ type: "rep/removed", id: result.data });
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
        if (result.ok) dispatch({ type: "lead/updated", lead: result.data });
        return result;
      },

      async saveStep(lead, step) {
        const result = await crmApi.updateMilestone(lead, step);
        if (result.ok) dispatch({ type: "lead/updated", lead: result.data });
        return result;
      },

      async removeStep(lead, stepId) {
        const result = await crmApi.removeMilestone(lead, stepId);
        if (result.ok) dispatch({ type: "lead/updated", lead: result.data });
        return result;
      },

      async reorderSteps(lead, orderedIds) {
        const result = await crmApi.reorderMilestones(lead, orderedIds);
        if (result.ok) dispatch({ type: "lead/updated", lead: result.data });
        return result;
      },

      async addPreview(lead, input) {
        const result = await crmApi.addPreview(lead, input);
        if (result.ok) dispatch({ type: "lead/updated", lead: result.data });
        return result;
      },

      async removePreview(lead, previewId) {
        const result = await crmApi.removePreview(lead, previewId);
        if (result.ok) dispatch({ type: "lead/updated", lead: result.data });
        return result;
      },

      async setLiveUrl(lead, url) {
        const result = await crmApi.setLiveUrl(lead, url);
        if (result.ok) dispatch({ type: "lead/updated", lead: result.data });
        return result;
      },

      async postUpdate(lead, input) {
        const result = await crmApi.addUpdate(lead, input);
        if (result.ok) dispatch({ type: "lead/updated", lead: result.data });
        return result;
      },

      resetDemoData() {
        clearPersistedState();
        dispatch({ type: "reset" });
      },
    }),
    // Rebuilt when the signed-in person changes, which happens once per
    // session. Everything else in here is dispatch-only and stable.
    [authorName],
  );

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
export function useCrm(): CrmContextValue {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error("useCrm() must be used inside <CrmProvider>.");
  }
  return context;
}
