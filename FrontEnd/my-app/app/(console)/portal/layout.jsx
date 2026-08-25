import { redirect } from "next/navigation";
import { homeFor } from "@/lib/session";
import { readSession } from "@/lib/session-server";
// Route guard for /portal — only the "client" role gets past this; everyone
// else is redirected home. Guarded both directions (not just non-clients out)
// because an admin session left in here would resolve session.clientLeadId to
// the demo client and render a stranger's project convincingly under its own
// name — an intentional "view as client" feature is the right way to do that.
// NOTE: readSession() reads an unsigned cookie today; this is a display switch
// until it reads a verified session. See lib/session.ts.
export default async function PortalLayout({ children, }) {
    const session = await readSession();
    if (session.role !== "client") {
        redirect(homeFor(session.role));
    }
    // The shell one level up supplies the rail and topbar.
    return children;
}
