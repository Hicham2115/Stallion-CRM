"use client";
import { PageShell } from "@/components/console/page-shell";
import { DeveloperCard } from "@/components/portal/developer-card";
import { MilestoneTrack } from "@/components/portal/milestone-track";
import { PortalMissing, PortalSkeleton } from "@/components/portal/portal-states";
import { ProjectHeader } from "@/components/portal/project-header";
import { ProjectLinks } from "@/components/portal/project-links";
import { usePortalLead } from "@/components/portal/use-portal-lead";
import { portalConfig } from "@/config/portal";
import { selectProjectProgress } from "@/lib/store/selectors";
const { features } = portalConfig;
// Every panel below is behind a flag in portalConfig.features. What's
// deliberately absent: pipeline stage, lead source, internal notes, sales
// timeline, other clients — see the CLIENT-SAFE RULE in config/portal.ts.
export function PortalView() {
    const { lead, loading } = usePortalLead();
    if (loading)
        return <PortalSkeleton />;
    if (!lead)
        return <PortalMissing />;
    const progress = selectProjectProgress(lead);
    return (<PageShell>
      <ProjectHeader lead={lead} progress={progress}/>

      {lead.developer !== undefined && <DeveloperCard developer={lead.developer}/>}

      {features.projectLinks && <ProjectLinks lead={lead}/>}

      {features.milestones && <MilestoneTrack milestones={lead.milestones}/>}
    </PageShell>);
}
