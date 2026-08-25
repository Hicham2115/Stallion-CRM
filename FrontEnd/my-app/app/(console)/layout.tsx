import { cookies } from "next/headers";

import { ConsoleSidebar } from "@/components/console/console-sidebar";
import { PageTitleProvider } from "@/components/console/page-title";
import { SessionProvider } from "@/components/console/session-provider";
import { ConsoleTopbar } from "@/components/console/console-topbar";
import { Toaster } from "@/components/ui/sonner";
import { consoleConfig } from "@/config/console";
import { readSession } from "@/lib/session-server";
import { CrmProvider } from "@/lib/store/crm-store";

/**
 * ============================================================================
 *  THE CONSOLE SHELL
 * ============================================================================
 *  Wraps every signed-in page: navigation rail, topbar, and the scroll region
 *  pages render into.
 *
 *  It is a ROUTE GROUP — the (console) folder does not appear in any URL, it
 *  just marks which routes get this chrome. /login sits outside it and is
 *  untouched.
 *
 *  TWO AUDIENCES, ONE SHELL. The agency console (/admin) and the client portal
 *  (/portal) share this file. They are genuinely the same product — same rail,
 *  same topbar, same panels — and the only thing that differs is WHICH nav
 *  items and WHOSE name, both of which come from the session read below. A
 *  second shell for the portal would be a second place for the chrome to drift.
 *
 *  Which routes each role may enter is enforced one level down, in
 *  app/(console)/admin/layout.tsx and app/(console)/portal/layout.tsx.
 *
 *  Two attributes on the shell do a lot of work:
 *    data-surface="console"  applies the whole console token set (dialled-down
 *                            atmosphere, deck surfaces, and the shadcn colour
 *                            bridge) — see the CONSOLE LAYER in globals.css
 *    className="dark"        makes the `dark:` variants baked into the shadcn
 *                            components resolve
 * ============================================================================
 */
export default async function ConsoleLayout({
  children,
}: LayoutProps<"/">) {
  // Read the sidebar preference on the server so the rail renders at the right
  // width on the very first paint. Restoring it in a useEffect instead would
  // flash expanded-then-collapsed on every page load.
  const cookieStore = await cookies();
  const collapsed =
    cookieStore.get(consoleConfig.layout.sidebarCookie)?.value === "1";

  // Who is asking. Same reasoning as the line above, and it matters more here:
  // a client who saw the admin sidebar for one frame would have seen the names
  // of the destinations they are not allowed into.
  const session = await readSession();

  return (
    <SessionProvider session={session}>
    <CrmProvider>
      {/* Lets a detail page put the record's name in the topbar. The six fixed
          screens keep taking their heading from config/navigation.ts. */}
      <PageTitleProvider>
      <div
        data-surface="console"
        className="dark flex min-h-dvh w-full bg-deck-void text-ink"
      >
        {/* First focus stop on the page. Keyboard users should not have to tab
            through six nav links on every navigation to reach the content. */}
        <a
          href="#console-main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-deck-void"
        >
          {consoleConfig.content.skipToContent}
        </a>

        {/* Role decides which nav items exist. It comes from the session,
            which today is an unsigned cookie — see the warning block at the
            top of lib/session.ts. Hiding a nav item is a courtesy; the
            server-side check is the boundary. */}
        <ConsoleSidebar role={session.role} defaultCollapsed={collapsed} />

        <div className="flex min-w-0 flex-1 flex-col">
          <ConsoleTopbar />

          <main
            id="console-main"
            // deck-grain only. The blueprint grid stays on the chrome — texture
            // behind a data table is noise, not atmosphere.
            className="deck-grain deck-scroll relative isolate flex-1 overflow-x-hidden px-4 py-6 sm:px-6 sm:py-7"
          >
            {children}
          </main>
        </div>

        {/* Mounted once for the whole console. Every mutation confirms through
            here, and the destructive ones carry an Undo — see
            components/deck/confirm-dialog.tsx.

            `theme="dark"` is passed explicitly rather than left to next-themes:
            the console is dark by the data-surface attribute on this shell, not
            by a theme class on <html>, so the toaster's own `useTheme()` would
            resolve to the document theme and paint a white toast on a near-black
            page. */}
        <Toaster
          theme="dark"
          position="bottom-right"
          closeButton
          toastOptions={{
            classNames: {
              toast:
                "cn-toast !border-hairline !bg-deck-card !text-ink !rounded-xl",
              actionButton: "!bg-brand !text-deck-void !font-semibold",
            },
          }}
        />
      </div>
      </PageTitleProvider>
    </CrmProvider>
    </SessionProvider>
  );
}
