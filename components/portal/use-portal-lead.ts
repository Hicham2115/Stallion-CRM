"use client";

import { useSession } from "@/components/console/session-provider";
import { useCrm } from "@/lib/store/crm-store";
import { selectClientLead } from "@/lib/store/selectors";
import type { Lead } from "@/lib/types";

/**
 * ============================================================================
 *  THE SIGNED-IN CLIENT'S RECORD
 * ============================================================================
 *  Every portal screen starts here. One hook rather than four copies of the
 *  same three lines, so "which record am I allowed to read" is answered in one
 *  place — and changing that answer when the backend lands is one edit.
 *
 *  THE ID COMES FROM THE SESSION, NEVER FROM THE URL. That is why no portal
 *  route has a `[clientId]` segment: there would be nothing to put in it that
 *  the session does not already know, and a client id in the address bar is an
 *  invitation to try someone else's.
 *
 *  WHY `loading` IS NOT SIMPLY `!state.hydrated`. The store renders from the
 *  seed on the server and again on the first client render, then swaps in
 *  persisted state in an effect. A seeded client is therefore present
 *  immediately, server-side included, and waiting for hydration would trade a
 *  real server-rendered page for a skeleton flash on every single load. Only an
 *  UNRESOLVED id has to wait a frame — it may be a record that exists solely in
 *  persisted state. Once hydration is done, missing means missing.
 * ============================================================================
 */
export function usePortalLead(): {
  /** The client's own record, or undefined once we know there is none. */
  lead: Lead | undefined;
  /** True only while an unresolved id is still waiting on hydration. */
  loading: boolean;
} {
  const { state } = useCrm();
  const session = useSession();

  const lead = selectClientLead(state, session);

  return { lead, loading: !lead && !state.hydrated };
}
