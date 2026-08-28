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
    {
      name: "stallion-session",
      // localStorage reads resolve synchronously inside zustand's persist,
      // so without this the store would already hold the real session by
      // the time React hydrates — different from what the server rendered
      // (no localStorage there) and a guaranteed hydration mismatch.
      // useSessionHydrated() below calls persist.rehydrate() in an effect,
      // safely after the client's first render is reconciled against the
      // server's.
      skipHydration: true,
    },
  ),
);

