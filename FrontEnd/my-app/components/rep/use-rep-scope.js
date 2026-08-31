"use client";
import { useSession } from "@/components/console/session-provider";
import { useCrm } from "@/lib/store/crm-store";
import { selectRepClients, selectRepKpis, selectRepLeads, selectSessionRep, } from "@/lib/store/selectors";
// Every rep screen starts here — one place answering "whose leads am I
// looking at". The id comes from the session, never the URL, so no rep
// route carries a rep id. `loading` waits on state.hydrated even though a
// seeded rep is present immediately: the seed's numbers aren't the real
// (persisted) ones, so rendering before hydration flashes mock data that
// then jumps once the real state swaps in.
export function useRepScope() {
    const { state } = useCrm();
    const session = useSession();
    const rep = selectSessionRep(state, session);
    return {
        rep,
        leads: selectRepLeads(state, session.repId),
        clients: selectRepClients(state, session.repId),
        kpis: selectRepKpis(state, session.repId),
        loading: !state.hydrated,
    };
}
