"use client";

import { PageShell } from "@/components/console/page-shell";
import { PortalMissing, PortalSkeleton } from "@/components/portal/portal-states";
import { PreviewGallery } from "@/components/portal/preview-gallery";
import { ProjectLinks } from "@/components/portal/project-links";
import { usePortalLead } from "@/components/portal/use-portal-lead";

/**
 * ============================================================================
 *  PREVIEWS
 * ============================================================================
 *  The prototype's "Previews" panel, given a screen of its own.
 *
 *  It leads with the same preview + live-site cards the overview shows, and
 *  that repetition is deliberate: a client who followed "See all previews" is
 *  here to open something, and making them navigate back for the actual link
 *  would be a loop. The gallery underneath is the history — every version
 *  shared, newest first, with what changed in each.
 * ============================================================================
 */
export function PreviewsView() {
  const { lead, loading } = usePortalLead();

  if (loading) return <PortalSkeleton />;
  if (!lead) return <PortalMissing />;

  return (
    <PageShell>
      {/* No gallery link: the gallery is the next element on this page. */}
      <ProjectLinks lead={lead} showGalleryLink={false} />
      <PreviewGallery previews={lead.previews} />
    </PageShell>
  );
}
