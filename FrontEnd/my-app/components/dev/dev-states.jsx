import Link from "next/link";
import { SearchX } from "lucide-react";
import { PageShell } from "@/components/console/page-shell";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { devConfig } from "@/config/dev";
const { content, routes } = devConfig;
// Shaped like the real page so nothing jumps when data lands.
export function DevSkeleton() {
    return (<PageShell>
      <Panel className="h-[7.5rem] animate-pulse"/>
      <Panel className="h-[18rem] animate-pulse"/>
      <Panel className="h-[22rem] animate-pulse"/>
    </PageShell>);
}
// A stale bookmark, or a record deleted elsewhere while this tab was open.
// Offers "go back to the list" rather than "sign in again" — a developer
// hasn't lost their session, just their link.
export function DevMissing() {
    return (<PageShell>
      <Panel>
        <EmptyState icon={SearchX} title={content.missingTitle} description={content.missingDescription} action={<Link href={routes.home} className="mt-1 inline-flex h-10 items-center rounded-md border border-hairline bg-white/[0.03] px-4 text-[0.875rem] font-medium text-ink transition-colors hover:border-hairline-strong hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
              {content.missingAction}
            </Link>}/>
      </Panel>
    </PageShell>);
}
