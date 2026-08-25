"use client";
import { createContext, useContext } from "react";
import { ANONYMOUS_SESSION } from "@/lib/session";
// Hands the session — read once server-side in app/(console)/layout.tsx —
// down to Client Components several levels deep (sidebar, topbar, portal
// panels) without threading it through every prop signature in between.
// Read on the server rather than fetched client-side so the first byte of
// HTML already has the right chrome (no wrong-sidebar flash). Read-only: who
// you are only changes at /login or Log Out, both of which reload the page.
const SessionContext = createContext(null);
export function SessionProvider({ session, children, }) {
    return (<SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>);
}
// Falls back to ANONYMOUS_SESSION outside the provider (rather than
// throwing, like useCrm() does) since a shared component may legitimately
// render on /login where there's no session at all.
export function useSession() {
    return useContext(SessionContext) ?? ANONYMOUS_SESSION;
}
