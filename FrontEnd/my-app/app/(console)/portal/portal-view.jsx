"use client";
import { PageShell } from "@/components/console/page-shell";
import { ContactCard } from "@/components/portal/contact-card";
import { InvoicePanel } from "@/components/portal/invoice-panel";
import { MilestoneTrack } from "@/components/portal/milestone-track";
import { PortalMissing, PortalSkeleton } from "@/components/portal/portal-states";
import { ProjectHeader } from "@/components/portal/project-header";
import { ProjectLinks } from "@/components/portal/project-links";
import { ProjectStatus } from "@/components/portal/project-status";
import { UpdatesFeed } from "@/components/portal/updates-feed";
import { usePortalLead } from "@/components/portal/use-portal-lead";
import { portalConfig } from "@/config/portal";
import { useCrm } from "@/lib/store/crm-store";
import { selectProjectProgress, selectRepById } from "@/lib/store/selectors";
const { features } = portalConfig;
// Every panel below is behind a flag in portalConfig.features. What's
// deliberately absent: pipeline stage, lead source, internal notes, sales
// timeline, other clients — see the CLIENT-SAFE RULE in config/portal.ts.
export function PortalView() {
    const { state } = useCrm();
    const { lead, loading } = usePortalLead();
    if (loading)
        return <PortalSkeleton />;
    if (!lead)
        return <PortalMissing />;
    const progress = selectProjectProgress(lead);
    const rep = selectRepById(state, lead.assignedRepId);
    return (<PageShell>
      <ProjectHeader lead={lead} progress={progress}/>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {features.statusPanel && (<div className="lg:col-span-8">
            <ProjectStatus progress={progress}/>
          </div>)}

        {features.contact && (<div className="lg:col-span-4">
            <ContactCard rep={rep} projectName={lead.company}/>
          </div>)}
      </div>

      {features.projectLinks && <ProjectLinks lead={lead}/>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {features.milestones && (<div className="lg:col-span-5">
            <MilestoneTrack milestones={lead.milestones}/>
          </div>)}

        {features.updates && (<div className="lg:col-span-4">
            <UpdatesFeed updates={lead.updates}/>
          </div>)}

        {features.invoices && (<div className="lg:col-span-3">
            <InvoicePanel invoices={lead.invoices} variant="summary"/>
          </div>)}
      </div>
    </PageShell>);
}
