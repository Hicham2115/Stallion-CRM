import "server-only";

import { cookies } from "next/headers";

import {
  SESSION_CLIENT_COOKIE,
  SESSION_REP_COOKIE,
  SESSION_ROLE_COOKIE,
  parseSession,
  type Session,
} from "@/lib/session";

/**
 * ============================================================================
 *  SESSION — THE SERVER READ
 * ============================================================================
 *  The one place the app asks "who is this". Split out from lib/session.ts so
 *  that file stays importable from Client Components: `next/headers` is
 *  server-only, and importing it into a client bundle is a build error rather
 *  than a runtime one.
 *
 *  `import "server-only"` at the top makes that guarantee enforceable — a
 *  Client Component that imports this file fails to build with a message
 *  saying so, instead of leaking the read into the browser.
 *
 *  TODO(backend): replace the body of readSession() with your provider's
 *  session lookup. Everything downstream — the two route guards, the sidebar,
 *  the topbar identity, the portal's record lookup — reads this function and
 *  nothing else, so nothing else has to change.
 * ============================================================================
 */

/**
 * The current session, from the request's cookies.
 *
 * Async because `cookies()` is async in Next 16 (it was synchronous in 14).
 * Reading it opts the calling route into dynamic rendering, which is correct:
 * a page whose content depends on who is asking must not be prerendered once
 * and shared.
 */
export async function readSession(): Promise<Session> {
  const store = await cookies();

  return parseSession(
    store.get(SESSION_ROLE_COOKIE)?.value,
    store.get(SESSION_CLIENT_COOKIE)?.value,
    store.get(SESSION_REP_COOKIE)?.value,
  );
}
