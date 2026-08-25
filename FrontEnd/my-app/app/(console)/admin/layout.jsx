import { redirect } from "next/navigation";
import { homeFor } from "@/lib/session";
import { readSession } from "@/lib/session-server";
// Route guard for /admin, the agency lead's surface (whole pipeline, every
// lead, rep performance, reports, settings). A layout rather than a per-page
// check so it also covers every future route added to this folder.
// Redirects rather than 404s since the person is signed in and the page
// exists — it's just not theirs.
//
// Not real security yet: it reads an unsigned cookie anyone can edit. It's
// the right shape (server-side check before markup), but becomes a real
// boundary only once readSession() reads a verified session AND the API
// refuses to serve agency data to a client token. See lib/session.ts.
export default async function AdminLayout({ children, }) {
    const session = await readSession();
    // Allow-list, not a deny-list, so a new role is locked out by default
    // rather than silently let in.
    if (session.role !== "admin") {
        redirect(homeFor(session.role));
    }
    return children;
}
