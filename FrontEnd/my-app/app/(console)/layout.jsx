import { cookies } from "next/headers";
import { ConsoleSidebar } from "@/components/console/console-sidebar";
import { ConsoleQueryProvider } from "@/components/console/console-query-provider";
import { PageTitleProvider } from "@/components/console/page-title";
import { ConsoleTopbar } from "@/components/console/console-topbar";
import { Toaster } from "@/components/ui/sonner";
import { consoleConfig } from "@/config/console";
import { CrmProvider } from "@/lib/store/crm-store";
// The console shell: nav rail, topbar, scroll region. (console) is a route
// group — it doesn't appear in any URL — and wraps both the agency console
// (/admin) and the client portal (/portal), which share the same rail/topbar
// and differ only in which nav items and whose name, both from the session
// (ConsoleSidebar/ConsoleTopbar read it themselves via useSession()).
// Which routes each role may enter is enforced one level down, in
// app/(console)/admin/layout.jsx and app/(console)/portal/layout.jsx.
export default async function ConsoleLayout({ children }) {
  // Read server-side so the rail renders at the right width on first paint
  // instead of flashing expanded-then-collapsed. Unrelated to the session —
  // just a remembered UI preference, so it's fine to stay a cookie.
  const cookieStore = await cookies();
  const collapsed =
    cookieStore.get(consoleConfig.layout.sidebarCookie)?.value === "1";
  return (
    <ConsoleQueryProvider>
      <CrmProvider>
        <PageTitleProvider>
          <div
            data-surface="console"
            className="dark flex min-h-dvh w-full bg-deck-void text-ink"
          >
            <a
              href="#console-main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-deck-void"
            >
              {consoleConfig.content.skipToContent}
            </a>

            {/* Hiding a nav item by role is a courtesy; the layout-level
            route guard is the real boundary. */}
            <ConsoleSidebar defaultCollapsed={collapsed} />

            <div className="flex min-w-0 flex-1 flex-col">
              <ConsoleTopbar />

              <main
                id="console-main"
                className="deck-grain deck-scroll relative isolate flex-1 overflow-x-hidden px-4 py-6 sm:px-6 sm:py-7"
              >
                {children}
              </main>
            </div>

            {/* theme="dark" passed explicitly since the console is dark via the
            data-surface attribute, not a theme class on <html> — next-themes'
            own useTheme() would otherwise resolve to the document theme. */}
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
    </ConsoleQueryProvider>
  );
}
