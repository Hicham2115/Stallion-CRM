import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Who is signed in, and the Sanctum token that proves it — entirely in
 * localStorage now, no cookies. lib/axios.ts reads the token to authorize
 * requests; components/console/session-provider.ts reads the rest.
 *
 * THIS IS NOT SECURITY. Anyone can edit localStorage from devtools. Every
 * route under app/(console)/ must be authorised again on the server by the
 * real backend, and every API response must be filtered to what that user is
 * allowed to see. This store only decides what the UI shows.
 */
export const useSessionStore = create(
  persist(
    (set) => ({
      role: null,
      clientLeadId: null,
      repId: null,
      token: null,
      setSession: (session) => set(session),
      clearSession: () =>
        set({ role: null, clientLeadId: null, repId: null, token: null }),
    }),
    { name: "stallion-session" },
  ),
);
