import { redirect } from "next/navigation";

import { homeFor } from "@/lib/session";
import { readSession } from "@/lib/session-server";

/**
 * ============================================================================
 *  ROUTE GUARD — THE CLIENT PORTAL
 * ============================================================================
 *  The mirror of app/(console)/admin/layout.tsx. Everything under /portal is
 *  built for one paying client looking at one project, so anyone who is not a
 *  client is sent back to the console.
 *
 *  WHY GUARD IT IN THIS DIRECTION TOO. An admin wandering into /portal would
 *  not see anything they are not allowed to see — but they WOULD see it
 *  through the wrong session, so the portal would resolve
 *  `session.clientLeadId` to the demo client and render a stranger's project
 *  under the admin's own name in the topbar. That is not a leak; it is worse in
 *  one specific way — it is convincing. An admin who does not notice would
 *  reasonably believe they were looking at real client-visible state.
 *
 *  When the agency genuinely needs to see what a client sees, that is a
 *  deliberate "view as client" feature launched from the lead detail page,
 *  with a banner saying so — not an admin session quietly rendering portal
 *  screens.
 *
 *  The same warning applies as on the admin guard: this reads an unsigned
 *  cookie today, and is a display switch until readSession() reads a verified
 *  session. See lib/session.ts.
 * ============================================================================
 */
export default async function PortalLayout({
  children,
}: LayoutProps<"/portal">) {
  const session = await readSession();

  if (session.role !== "client") {
    redirect(homeFor(session.role));
  }

  // The shell one level up supplies the rail and topbar. This layout is the
  // check and nothing else.
  return children;
}
