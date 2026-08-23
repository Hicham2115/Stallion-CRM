import Link from "next/link";
import { SearchX } from "lucide-react";

import { PageShell } from "@/components/console/page-shell";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { devConfig } from "@/config/dev";

const { content, routes } = devConfig;

/**
 * Placeholder while an unresolved project waits on hydration.
 *
 * Shaped like the real page — header, steps, previews — so nothing jumps when
 * the data lands. A skeleton of the wrong size is worse than none, because the
 * reader starts reading and the text moves out from under them.
 */
export function DevSkeleton() {
  return (
    <PageShell>
      <Panel className="h-[7.5rem] animate-pulse" />
      <Panel className="h-[18rem] animate-pulse" />
      <Panel className="h-[22rem] animate-pulse" />
    </PageShell>
  );
}

/**
 * Shown when the route names a project that is not there.
 *
 * A stale bookmark, or a record someone deleted from the admin console while
 * this tab was open. Unlike the client's version of this state, the offer here
 * is to go back to the list rather than to sign in again — a developer has not
 * lost their session, just their link.
 */
export function DevMissing() {
  return (
    <PageShell>
      <Panel>
        <EmptyState
          icon={SearchX}
          title={content.missingTitle}
          description={content.missingDescription}
          action={
            <Link
              href={routes.home}
              className="mt-1 inline-flex h-10 items-center rounded-xl border border-hairline bg-white/[0.03] px-4 text-[0.875rem] font-medium text-ink transition-colors hover:border-hairline-strong hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              {content.missingAction}
            </Link>
          }
        />
      </Panel>
    </PageShell>
  );
}
