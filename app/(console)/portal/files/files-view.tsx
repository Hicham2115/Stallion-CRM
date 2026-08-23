"use client";

import { PageShell } from "@/components/console/page-shell";
import { ContactCard } from "@/components/portal/contact-card";
import { FilePanel } from "@/components/portal/file-panel";
import { PortalMissing, PortalSkeleton } from "@/components/portal/portal-states";
import { usePortalLead } from "@/components/portal/use-portal-lead";
import { portalConfig } from "@/config/portal";
import { useCrm } from "@/lib/store/crm-store";
import { selectRepById } from "@/lib/store/selectors";

/**
 * ============================================================================
 *  FILES
 * ============================================================================
 *  Everything the client can take away: the brief they signed off, the
 *  contract, and the finished work.
 *
 *  The contact card rides along because "I cannot find the file" and "this is
 *  the wrong version" are the two things anyone says on a files screen, and
 *  both of them need a person rather than a page.
 * ============================================================================
 */
export function FilesView() {
  const { state } = useCrm();
  const { lead, loading } = usePortalLead();

  if (loading) return <PortalSkeleton />;
  if (!lead) return <PortalMissing />;

  const rep = selectRepById(state, lead.assignedRepId);

  return (
    <PageShell>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <FilePanel files={lead.files} />
        </div>

        {portalConfig.features.contact && (
          <div className="lg:col-span-4">
            <ContactCard rep={rep} projectName={lead.company} />
          </div>
        )}
      </div>
    </PageShell>
  );
}
