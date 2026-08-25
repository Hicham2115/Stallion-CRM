import { redirect } from "next/navigation";

import { homeFor } from "@/lib/session";
import { readSession } from "@/lib/session-server";

/**
 * ============================================================================
 *  ROUTE GUARD — THE SALES REP WORKSPACE
 * ============================================================================
 *  The fourth of four guards, alongside app/(console)/admin, /dev and /portal.
 *
 *  Everything under /rep is one rep's own pipeline, and the screens assume it:
 *  the sidebar readout is "my dials today", the tables carry no owner column,
 *  and the copy is first-person throughout. An admin arriving here would see
 *  the DEMO rep's figures under their own name in the topbar — not a leak, but
 *  a convincing lie, which is worse than an obvious one.
 *
 *  A client or a developer has no business here at all: this is the sales
 *  funnel, including the internal notes and the lead sources that the
 *  CLIENT-SAFE RULE keeps off the portal entirely.
 *
 *  The same warning as the other three: this reads an unsigned cookie today, so
 *  it is a display switch, not a boundary. It becomes one when readSession()
 *  verifies a real session AND the API returns only the signed-in rep's leads.
 *  See lib/session.ts and the field-ownership table in config/roles.ts.
 * ============================================================================
 */
export default async function RepLayout({ children }: LayoutProps<"/rep">) {
  const session = await readSession();

  if (session.role !== "sales") {
    redirect(homeFor(session.role));
  }

  // The shell one level up supplies the rail and the topbar. This layout is
  // the check and nothing else.
  return children;
}
