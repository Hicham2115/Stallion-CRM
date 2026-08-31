"use client";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/components/console/session-provider";
import { api } from "@/lib/axios";
import { mapProjectFields } from "@/lib/crm-api";
import { useCrm } from "@/lib/store/crm-store";
import { useSessionStore } from "@/lib/store/session-store";
import { selectClientLead } from "@/lib/store/selectors";

// Every portal screen starts here — one place answering "which record am I
// allowed to read". A real (Sanctum-backed) client account reads its own
// project from the server, scoped by the signed-in user (never a lead id in
// the URL — see PortalController::show). A demo/mock session (no token,
// role/clientLeadId only in localStorage — see session-store.js's own
// warning that this isn't real auth) keeps reading the sample seed, so the
// existing demo experience is unchanged.
export function usePortalLead() {
  const { state } = useCrm();
  const session = useSession();
  const token = useSessionStore((s) => s.token);
  const isRealClient = Boolean(token) && session.role === "client";

  const {
    data: realLead,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["portal-lead"],
    queryFn: async () => (await api.get("/api/portal/lead")).data,
    enabled: isRealClient,
    // "No project linked to this account" isn't transient — retrying it
    // three times just delays PortalMissing showing up by several seconds.
    retry: false,
  });

  if (isRealClient) {
    if (isPending) return { lead: null, loading: true };
    if (isError || !realLead) return { lead: null, loading: false };
    return {
      lead: {
        id: String(realLead.id),
        name: realLead.name,
        company: realLead.company,
        projectSummary: realLead.project_summary,
        assignedRepId: null,
        developer: realLead.developer ?? null,
        ...mapProjectFields(realLead),
      },
      loading: false,
    };
  }

  const lead = selectClientLead(state, session);
  return { lead, loading: !lead && !state.hydrated };
}
