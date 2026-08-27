"use client";
import { useSession } from "@/components/console/session-provider";
import { useCrm } from "@/lib/store/crm-store";
import { selectRepClients, selectRepKpis, selectRepLeads, selectSessionRep, } from "@/lib/store/selectors";
// Every rep screen starts here — one place answering "whose leads am I
// looking at". The id comes from the session, never the URL, so no rep
// route carries a rep id. `loading` isn't simply !state.hydrated: a seeded
// rep is present immediately server-side, so only an unresolved id waits a
// frame.
export function useRepScope() {
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
