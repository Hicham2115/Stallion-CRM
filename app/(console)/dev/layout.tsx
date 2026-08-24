import { redirect } from "next/navigation";

import { homeFor } from "@/lib/session";
import { readSession } from "@/lib/session-server";

/**
 * ============================================================================
 *  ROUTE GUARD — THE DEV WORKSPACE
 * ============================================================================
 *  The third of three guards, matching app/(console)/admin/layout.tsx and
 *  app/(console)/portal/layout.tsx. Everything under /dev is delivery work
 *  across EVERY client, so the two audiences it exists to keep out are
 *  different in kind:
 *
 *    a client   would see other clients' projects — every screenshot, every
 *               live URL, every note the agency has posted to anyone else.
 *               This is the one guard in the product whose absence would be a
 *               real data leak rather than a wrong-looking page.
 *
 *    an admin   would see the workspace through a session that has no business
 *               ticking delivery steps, on a screen whose whole design
 *               assumes its user is the person doing the building. They have
 *               the same records on the lead detail page, framed correctly.
 *
 *  Same warning as the other two: this reads an unsigned cookie today, so it
 *  is a display switch and not a boundary. It becomes one when readSession()
 *  verifies a real session AND the API refuses to serve one client's project
 *  data to another client's token. See lib/session.ts, and the field-ownership
 *  table in config/roles.ts.
 * ============================================================================
 */
export default async function DevLayout({ children }: LayoutProps<"/dev">) {
  const session = await readSession();

  if (session.role !== "dev") {
    redirect(homeFor(session.role));
  }

  // The shell one level up supplies the rail and topbar. This layout is the
  // check and nothing else.
  return children;
}
