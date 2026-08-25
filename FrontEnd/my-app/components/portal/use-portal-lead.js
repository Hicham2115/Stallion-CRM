"use client";
import { useSession } from "@/components/console/session-provider";
import { useCrm } from "@/lib/store/crm-store";
import { selectClientLead } from "@/lib/store/selectors";
// Every portal screen starts here — one place answering "which record am I
// allowed to read". The id comes from the session, never the URL (no
// [clientId] segment on any portal route), since a client id in the address
// bar is an invitation to try someone else's. `loading` isn't simply
// !state.hydrated: a seeded client is present immediately server-side, so
// only an unresolved id waits a frame for hydration.
export function usePortalLead() {
    const { state } = useCrm();
    const session = useSession();
    const lead = selectClientLead(state, session);
    return { lead, loading: !lead && !state.hydrated };
}
