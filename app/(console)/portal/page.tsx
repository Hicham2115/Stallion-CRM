import type { Metadata } from "next";

import { PortalView } from "./portal-view";

export const metadata: Metadata = {
  title: "My project",
};

/**
 * /portal — the client portal's home.
 *
 * A thin Server Component. The record lives in the browser store today, so the
 * view beside this file does the work; this file exists to own the route and
 * its metadata.
 *
 * The route is already guarded: app/(console)/portal/layout.tsx checks the
 * session before any of this renders, so there is no check to repeat here.
 *
 * TODO(backend): fetch the signed-in client's record HERE, on the server, from
 * the session's client id — never from a param — and pass it down. That is what
 * makes the CLIENT-SAFE RULE enforceable: the internal fields never reach the
 * browser at all, rather than reaching it and being politely ignored.
 */
export default function PortalPage() {
  return <PortalView />;
}
