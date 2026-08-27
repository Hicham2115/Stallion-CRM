import { redirect } from "next/navigation";
import { homeFor } from "@/lib/session";
import { readSession } from "@/lib/session-server";
// Route guard for /rep, one rep's own pipeline — the screens assume it
// throughout (first-person copy, no owner column). Same caveat as the other
// three guards: reads an unsigned cookie today, so it's a display switch,
// not a real boundary, until readSession() verifies a real session and the
// API returns only the signed-in rep's leads. See lib/session.ts.
export default async function RepLayout({ children }) {
    const session = await readSession();
    if (session.role !== "sales") {
        redirect(homeFor(session.role));
    }
    return children;
}
