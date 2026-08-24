"use client";

import { useSession } from "@/components/console/session-provider";
import { useCrm } from "@/lib/store/crm-store";
import {
  selectRepClients,
  selectRepKpis,
  selectRepLeads,
  selectSessionRep,
  type RepKpiValues,
} from "@/lib/store/selectors";
import type { Lead, Rep } from "@/lib/types";

/**
 * ============================================================================
 *  THE SIGNED-IN REP, AND EVERYTHING SCOPED TO THEM
 * ============================================================================
 *  Every rep screen starts here. One hook rather than five copies of the same
 *  four lines, so "whose leads am I looking at" is answered in exactly one
 *  place — and narrowing or widening that answer when the backend lands is one
 *  edit.
 *
 *  THE ID COMES FROM THE SESSION, NEVER FROM THE URL. That is why no rep route
 *  carries a rep id: `/rep/pipeline?rep=rep-3` would be the first thing anyone
 *  tried, and the first commission argument the product caused.
 *
 *  WHY `loading` IS NOT SIMPLY `!state.hydrated`. The store renders from the
 *  seed on the server AND on the first client render, so a seeded rep is
 *  present immediately and waiting for hydration would trade a real
 *  server-rendered page for a skeleton flash on every load. Only an UNRESOLVED
 *  id has to wait a frame — it may be a record created in this browser that
 *  lives solely in persisted state. Once hydration is done, missing is missing.
 * ============================================================================
 */
export function useRepScope(): {
  /** The rep's own record, or undefined once we know there is none. */
  rep: Rep | undefined;
  /** Every lead assigned to them. */
  leads: Lead[];
  /** The subset of those that converted. */
  clients: Lead[];
  /** Their four dashboard figures. */
  kpis: RepKpiValues;
  /** True only while an unresolved rep id is still waiting on hydration. */
  loading: boolean;
} {
  const { state } = useCrm();
  const session = useSession();

  const rep = selectSessionRep(state, session);

  return {
    rep,
    leads: selectRepLeads(state, session.repId),
    clients: selectRepClients(state, session.repId),
    kpis: selectRepKpis(state, session.repId),
    loading: !rep && !state.hydrated,
  };
}
