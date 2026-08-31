import Link from "next/link";
import { SearchX, UserRoundX } from "lucide-react";
import { PageShell } from "@/components/console/page-shell";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { navigation } from "@/config/navigation";
import { repConfig } from "@/config/rep";
const { content, routes } = repConfig;
// Shaped like the dashboard so nothing jumps when data lands.
export function RepSkeleton() {
    return (<PageShell>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel className="h-[9rem] animate-pulse"/>
        <Panel className="h-[9rem] animate-pulse"/>
        <Panel className="h-[9rem] animate-pulse"/>
        <Panel className="h-[9rem] animate-pulse"/>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel className="h-[20rem] animate-pulse lg:col-span-7"/>
        <Panel className="h-[20rem] animate-pulse lg:col-span-5"/>
      </div>
    </PageShell>);
}
// Shown when the session points at a rep record that's not there (rare — an
// admin deleting a rep while they're signed in) rather than a dashboard of
// zeroes, which would read as "you did no work" instead of "we lost your profile".
export function RepMissing() {
    return (<PageShell>
      <Panel>
        <EmptyState icon={UserRoundX} title={content.missingRepTitle} description={content.missingRepDescription} action={<Link href={navigation.signOut.href} className="mt-1 inline-flex h-10 items-center rounded-md border border-hairline bg-white/[0.03] px-4 text-[0.875rem] font-medium text-ink transition-colors hover:border-hairline-strong hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
              {content.lead.forbiddenAction}
            </Link>}/>
      </Panel>
    </PageShell>);
}
// Two messages, one component: "not yours" vs "not there" get different
// copy since collapsing them into one "not found" would make a reassignment
// look like a bug. Never says who the lead belongs to.
export function RepLeadBlocked({ reason }) {
    const forbidden = reason === "forbidden";
    return (<PageShell>
      <Panel>
        <EmptyState icon={forbidden ? UserRoundX : SearchX} title={forbidden ? content.lead.forbiddenTitle : content.lead.notFoundTitle} description={forbidden
            ? content.lead.forbiddenDescription
            : content.lead.notFoundDescription} action={<Link href={routes.pipeline} className="mt-1 inline-flex h-10 items-center rounded-md border border-hairline bg-white/[0.03] px-4 text-[0.875rem] font-medium text-ink transition-colors hover:border-hairline-strong hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
              {content.lead.forbiddenAction}
            </Link>}/>
      </Panel>
    </PageShell>);
}
