"use client";

import { SearchX } from "lucide-react";

import { PageShell } from "@/components/console/page-shell";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { navigation } from "@/config/navigation";
import { portalConfig } from "@/config/portal";
import { clearPreviewSession } from "@/lib/session";

const { content } = portalConfig;

/**
 * ============================================================================
 *  WHOLE-SCREEN STATES
 * ============================================================================
 *  The two things a portal screen can be other than itself. Shared, because
 *  four screens showing four differently-worded versions of "we cannot find
 *  your project" is four chances to say it badly.
 * ============================================================================
 */

/**
 * Placeholder while an unresolved record waits on hydration.
 *
 * Its blocks match the real layout's shape, so the page does not jump when the
 * data lands — a skeleton that is the wrong size is a worse experience than no
 * skeleton, because the reader starts reading and the text moves.
 */
export function PortalSkeleton() {
  return (
    <PageShell>
      <Panel className="h-[10rem] animate-pulse" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel className="h-[13rem] animate-pulse lg:col-span-8" />
        <Panel className="h-[13rem] animate-pulse lg:col-span-4" />
      </div>
      <Panel className="h-[15rem] animate-pulse" />
    </PageShell>
  );
}

/**
 * Shown when the session points at a record that is not there.
 *
 * Deliberately NOT a 404 and NOT an error boundary. From the client's side
 * nothing is broken and nothing they did caused it — the honest reading is
 * "your sign-in is stale", so the action offered is to sign in again.
 *
 * It never names the id it was looking for. That string is our plumbing, and
 * printing it in front of a customer turns a calm dead end into something that
 * looks like a crash.
 */
export function PortalMissing() {
  return (
    <PageShell>
      <Panel>
        <EmptyState
          icon={SearchX}
          title={content.missingTitle}
          description={content.missingDescription}
          action={
            // A button, not a <Link>, because "sign in again" has to actually
            // END the session that is pointing at a record which is not there.
            // A plain link to /login would leave the stale cookie in place, so
            // the next sign-in would resolve to the same missing record and
            // land the client right back on this page.
            <button
              type="button"
              onClick={() => {
                clearPreviewSession();
                // Document navigation for the same reason as SignOutLink: the
                // destination is decided on the server from the cookie just
                // cleared. See components/console/sign-out-link.tsx.
                window.location.assign(navigation.signOut.href);
              }}
              className="mt-1 inline-flex h-10 items-center rounded-xl border border-hairline bg-white/[0.03] px-4 text-[0.875rem] font-medium text-ink transition-colors hover:border-hairline-strong hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              {content.missingAction}
            </button>
          }
        />
      </Panel>
    </PageShell>
  );
}
