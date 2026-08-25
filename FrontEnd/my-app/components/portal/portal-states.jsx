"use client";
import { SearchX } from "lucide-react";
import { PageShell } from "@/components/console/page-shell";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { navigation } from "@/config/navigation";
import { portalConfig } from "@/config/portal";
import { clearPreviewSession } from "@/lib/session";
const { content } = portalConfig;
// Blocks match the real layout's shape so the page doesn't jump when data lands.
export function PortalSkeleton() {
    return (<PageShell>
      <Panel className="h-[10rem] animate-pulse"/>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel className="h-[13rem] animate-pulse lg:col-span-8"/>
        <Panel className="h-[13rem] animate-pulse lg:col-span-4"/>
      </div>
      <Panel className="h-[15rem] animate-pulse"/>
    </PageShell>);
}
// Shown when the session points at a record that isn't there — deliberately
// not a 404 or error boundary, since the honest reading is "your sign-in is
// stale". Never names the id it was looking for.
export function PortalMissing() {
    return (<PageShell>
      <Panel>
        <EmptyState icon={SearchX} title={content.missingTitle} description={content.missingDescription} action={
        // Button, not a Link — "sign in again" has to end the stale session,
        // not just navigate while leaving the cookie in place.
        <button type="button" onClick={() => {
                clearPreviewSession();
                // Document navigation — destination is decided server-side
                // from the cookie just cleared. See sign-out-link.tsx.
                window.location.assign(navigation.signOut.href);
            }} className="mt-1 inline-flex h-10 items-center rounded-xl border border-hairline bg-white/[0.03] px-4 text-[0.875rem] font-medium text-ink transition-colors hover:border-hairline-strong hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
              {content.missingAction}
            </button>}/>
      </Panel>
    </PageShell>);
}
