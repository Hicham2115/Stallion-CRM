import { redirect } from "next/navigation";

import { homeFor } from "@/lib/session";
import { readSession } from "@/lib/session-server";

/**
 * ============================================================================
 *  ROUTE GUARD — THE AGENCY CONSOLE
 * ============================================================================
 *  Everything under /admin is the AGENCY LEAD's working surface: the whole
 *  pipeline, every lead in the database, rep performance, reports, settings.
 *  Nobody else belongs here — not a client, not a developer, and not a sales
 *  rep, who has the same four screens narrowed to their own leads at /rep.
 *
 *  WHY A LAYOUT AND NOT A CHECK ON EACH PAGE. A layout wraps every current and
 *  every FUTURE route in this folder. A per-page check protects the pages
 *  somebody remembered; this protects the page somebody adds next month
 *  without reading this comment.
 *
 *  WHY IT REDIRECTS INSTEAD OF 404-ING. The person is signed in and the page
 *  does exist — it is simply not theirs. Sending them to their own home is the
 *  useful outcome; a 404 would be a dead end for someone who did nothing wrong.
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  THIS IS NOT SECURITY YET. It reads an unsigned cookie, which anyone │
 *  │  can edit. It is the right SHAPE — a server-side check, before any   │
 *  │  markup is produced — but it becomes a real boundary only once       │
 *  │  readSession() reads a verified session AND the API refuses to serve │
 *  │  agency data to a client token. Both are required; neither alone is  │
 *  │  enough. See lib/session.ts.                                        │
 *  └──────────────────────────────────────────────────────────────────────┘
 * ============================================================================
 */
export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const session = await readSession();

  // An ALLOW-LIST, not a deny-list. It first read `if (role === "client")`,
  // which was correct with three roles and silently wrong the moment a fourth
  // arrived — `dev` would have walked straight into the pipeline. Naming who
  // may enter means a new role is locked out by default and has to be let in
  // deliberately, which is the failure direction you want.
  //
  // `sales` was on this list while reps had no front of their own. It is not
  // any more: the nav items under /admin are now `roles: ["admin"]`, so a rep
  // who got here would have seen the whole agency's pipeline framed by an
  // EMPTY SIDEBAR — no way back, and no indication anything was wrong. A rep's
  // four screens live at /rep, narrowed to their own leads.
  if (session.role !== "admin") {
    redirect(homeFor(session.role));
  }

  // No chrome of its own: the shell one level up already provides the rail and
  // the topbar. This layout exists purely to hold the check above.
  return children;
}
