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
// Steps and previews run full width since each row/tile needs the space;
// the live link and update composer share the last row since they're the
// same moment (the two things you do when the work is finished). The id
// comes from the route here (unlike the client portal) because a developer
// legitimately works across every client — see usePortalLead() for why the
// portal avoids an id in the client's address bar.
export function DevProjectView({ leadId }) {
    const { state } = useCrm();
    const lead = selectLeadById(state, leadId);
    useSetPageTitle({
        title: lead?.name ?? null,
        subtitle: lead?.company ?? null,
        parent: { label: content.detail.back, href: routes.home },
    });
    // A project we can already see renders immediately, server-side included;
    // only an unresolved id waits a frame for hydration.
    if (!lead) {
        if (!state.hydrated)
            return <DevSkeleton />;
        return <DevMissing />;
    }
    const progress = selectProjectProgress(lead);
    return (<PageShell>
      <DevProjectHeader lead={lead} progress={progress}/>

      {features.steps && <StepList lead={lead}/>}

      {features.previews && <PreviewManager lead={lead}/>}

      {(features.liveUrl || features.updates) && (<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {features.liveUrl && <LiveSitePanel lead={lead}/>}
          {features.updates && <UpdateComposer lead={lead}/>}
        </div>)}
    </PageShell>);
}
