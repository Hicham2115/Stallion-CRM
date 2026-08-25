"use client";

import { PageShell } from "@/components/console/page-shell";
import { useSetPageTitle } from "@/components/console/page-title";
import { DevMissing, DevSkeleton } from "@/components/dev/dev-states";
import { LiveSitePanel } from "@/components/dev/live-site-panel";
import { PreviewManager } from "@/components/dev/preview-manager";
import { DevProjectHeader } from "@/components/dev/project-header";
import { StepList } from "@/components/dev/step-list";
import { UpdateComposer } from "@/components/dev/update-composer";
import { devConfig } from "@/config/dev";
import { useCrm } from "@/lib/store/crm-store";
import { selectLeadById, selectProjectProgress } from "@/lib/store/selectors";

const { content, features, routes } = devConfig;

/**
 * ============================================================================
 *  ONE PROJECT
 * ============================================================================
 *  Everything a developer does for a client, in the order they do it:
 *
 *    1. who is this, how far along     DevProjectHeader
 *    2. what is left to build          StepList
 *    3. show them what exists          PreviewManager
 *    4. hand over the finished thing   LiveSitePanel
 *    5. tell them about it             UpdateComposer
 *
 *  The first three are the prototype, enhanced. The last two are the write
 *  side of two client-portal panels that previously had no way to be filled in
 *  from anywhere in the product.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  WHY THE LAYOUT SPLITS WHERE IT DOES
 *  ─────────────────────────────────────────────────────────────────────────
 *  Steps and previews run FULL WIDTH: a step row carries a handle, a tick, an
 *  editable label, a date and a remove, and a preview tile has to be big enough
 *  to recognise a screenshot in. Squeezing either into half a screen makes them
 *  worse at the one thing they are for.
 *
 *  The live link and the update composer share the last row because they are
 *  the same moment — the two things you do when the work is finished — and
 *  neither needs more than half a screen to be a URL field and a text box.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  THE ID COMES FROM THE ROUTE HERE, UNLIKE THE PORTAL
 *  ─────────────────────────────────────────────────────────────────────────
 *  A developer legitimately works across every client, so `/dev/[leadId]` is
 *  the right shape and the guard on the folder is what stops anyone else
 *  reading it. The client portal deliberately has no such segment — see
 *  `usePortalLead()` for why an id in a client's address bar is an invitation.
 * ============================================================================
 */
export function DevProjectView({ leadId }: { leadId: string }) {
  const { state } = useCrm();
  const lead = selectLeadById(state, leadId);

  // The record's name in the topbar, with a breadcrumb back to the grid. Null
  // while loading, so the route title ("Projects") shows in the meantime rather
  // than an empty bar.
  useSetPageTitle({
    title: lead?.name ?? null,
    subtitle: lead?.company ?? null,
    parent: { label: content.detail.back, href: routes.home },
  });

  // Order matters, and it is the same reasoning as the admin lead detail: a
  // project we can already see renders immediately, server-side included, so
  // the common case gets real content and no skeleton flash. Only an
  // UNRESOLVED id waits a frame — it may be a project created in this browser
  // that lives solely in persisted state. Once hydration is done, missing
  // genuinely means missing.
  if (!lead) {
    if (!state.hydrated) return <DevSkeleton />;
    return <DevMissing />;
  }

  const progress = selectProjectProgress(lead);

  return (
    <PageShell>
      <DevProjectHeader lead={lead} progress={progress} />

      {features.steps && <StepList lead={lead} />}

      {features.previews && <PreviewManager lead={lead} />}

      {(features.liveUrl || features.updates) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {features.liveUrl && <LiveSitePanel lead={lead} />}
          {features.updates && <UpdateComposer lead={lead} />}
        </div>
      )}
    </PageShell>
  );
}
