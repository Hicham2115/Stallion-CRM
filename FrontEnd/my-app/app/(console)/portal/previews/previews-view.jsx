"use client";
import { PageShell } from "@/components/console/page-shell";
import { PortalMissing, PortalSkeleton } from "@/components/portal/portal-states";
import { PreviewGallery } from "@/components/portal/preview-gallery";
import { ProjectLinks } from "@/components/portal/project-links";
import { usePortalLead } from "@/components/portal/use-portal-lead";
// Leads with the same preview + live-site cards the overview shows, since a
// client following "See all previews" is here to open something.
export function PreviewsView() {
    const { lead, loading } = usePortalLead();
    if (loading)
        return <PortalSkeleton />;
    if (!lead)
        return <PortalMissing />;
    return (<PageShell>
      <ProjectLinks lead={lead} showGalleryLink={false}/>
      <PreviewGallery previews={lead.previews}/>
    </PageShell>);
}
