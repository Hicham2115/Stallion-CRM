"use client";
import { useEffect, useState } from "react";
import { portalConfig } from "@/config/portal";
import { repConfig } from "@/config/rep";
import { useSessionStore } from "@/lib/store/session-store";

// Session now lives in localStorage (via Zustand), not a server-read cookie —
// so any component can read it directly with useSession(), no provider or
// context needed. Falls back to the demo ids when a piece is missing (a
// signed-in user with no linked lead/rep record yet), same as before.
export function useSession() {
  const role = useSessionStore((state) => state.role) ?? "admin";
  const clientLeadId =
    useSessionStore((state) => state.clientLeadId) ?? portalConfig.demo.leadId;
  const repId = useSessionStore((state) => state.repId) ?? repConfig.demo.repId;
  return { role, clientLeadId, repId };
}

// localStorage isn't readable during the server render or the first client
// render (before hydration), so route guards must wait for this to flip to
// `true` before trusting `useSession()` — otherwise every visitor briefly
// looks like the default role and gets redirected, then corrected.
export function useSessionHydrated() {
  // `.persist` only exists once the store is created with `window` around —
  // on the server render of this "use client" component there is no
  // `window`, so zustand skips attaching it. Always start false there and
  // let the effect (browser-only) pick up the real value.
  const [hydrated, setHydrated] = useState(
    () => useSessionStore.persist?.hasHydrated() ?? false,
  );
  useEffect(() => {
    if (useSessionStore.persist?.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useSessionStore.persist?.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}
