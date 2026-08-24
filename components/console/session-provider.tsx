"use client";

import { createContext, useContext, type ReactNode } from "react";

import { ANONYMOUS_SESSION, type Session } from "@/lib/session";

/**
 * ============================================================================
 *  SESSION CONTEXT
 * ============================================================================
 *  Hands the session — read once on the SERVER in app/(console)/layout.tsx —
 *  down to the Client Components that need it: the sidebar (which nav to
 *  render), the topbar (whose name to print), and every portal screen (which
 *  record to load).
 *
 *  WHY A CONTEXT RATHER THAN A PROP CHAIN. The session is needed four and five
 *  levels down — ConsoleSidebar > ConsoleNav, and every panel inside a portal
 *  view — and threading `session` through every component in between makes the
 *  signature of each one about plumbing rather than about what it renders.
 *
 *  WHY IT IS READ ON THE SERVER AND NOT HERE. A client that fetched its own
 *  session would render the wrong chrome first and correct itself a frame
 *  later: a client would see the admin sidebar flash past on every page load.
 *  Reading the cookie during the server render means the very first byte of
 *  HTML is already the right one.
 *
 *  It is READ-ONLY on purpose. Nothing in the console changes who you are;
 *  that happens at /login and at Log Out, both of which reload the page so the
 *  server picks up the new cookie.
 * ============================================================================
 */

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({
  session,
  children,
}: {
  session: Session;
  children: ReactNode;
}) {
  // The session object is created fresh per request on the server, so there is
  // nothing to memoise — a `useMemo` here would be guarding against a re-render
  // that cannot happen.
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * The current session.
 *
 * Falls back to `ANONYMOUS_SESSION` outside the provider rather than throwing,
 * because a shared component (the deck primitives, a dialog) may legitimately
 * render on /login where there is no session at all. That is the opposite call
 * from `useCrm()`, which throws — but the CRM store has no meaningful "no
 * store" state, and a session does.
 */
export function useSession(): Session {
  return useContext(SessionContext) ?? ANONYMOUS_SESSION;
}
