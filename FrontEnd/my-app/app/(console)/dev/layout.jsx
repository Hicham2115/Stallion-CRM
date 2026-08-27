import { redirect } from "next/navigation";
import { homeFor } from "@/lib/session";
import { readSession } from "@/lib/session-server";
// Route guard for /dev — delivery work across every client, so only the "dev"
// role gets past this. A client here would see other clients' projects (a real
// data leak, unlike the other guards); an admin would see it through a session
// not meant for ticking delivery steps.
// NOTE: readSession() reads an unsigned cookie today, so this is a display
// switch, not a real boundary, until it verifies a session AND the API refuses
// to serve one client's data to another client's token. See lib/session.ts and
// config/roles.ts.
export default async function DevLayout({ children }) {
    const session = await readSession();
    if (session.role !== "dev") {
        redirect(homeFor(session.role));
    }
    // The shell one level up supplies the rail and topbar.
    return children;
}
