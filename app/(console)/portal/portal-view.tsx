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

/**
 * ============================================================================
 *  MY PROJECT — the client portal's home
 * ============================================================================
 *  Everything a client wants to know about their project, in the order they
 *  want to know it:
 *
 *    1. how far along is it          ProjectHeader   (the progress rail)
 *    2. what is happening right now  ProjectStatus
 *    3. who do I ask                 ContactCard
 *    4. can I SEE it                 ProjectLinks    (preview + live site)
 *    5. what are the stages          MilestoneTrack
 *    6. what changed lately          UpdatesFeed
 *    7. what do I owe                InvoicePanel    (summary)
 *
 *  The prototype had items 1, 5 and 7 and a screenshot box. The additions are
 *  the ones that turn a status readout into something a client can act on: the
 *  links, the named contact, and a plain-language statement of what is
 *  happening this week.
 *
 *  WHAT IS DELIBERATELY ABSENT: the pipeline stage, the lead source, the
 *  internal notes, the sales timeline, and every other client. See the
 *  CLIENT-SAFE RULE at the top of config/portal.ts.
 *
 *  Every panel below is behind a flag in `portalConfig.features`, so this
 *  screen can be cut down to the prototype's four blocks without editing JSX.
 * ============================================================================
 */
export function PortalView() {
  const { state } = useCrm();
  const { lead, loading } = usePortalLead();

  if (loading) return <PortalSkeleton />;
  if (!lead) return <PortalMissing />;

  const progress = selectProjectProgress(lead);
  // The rep who owns this client. `undefined` when nobody is assigned, which
  // the contact card renders as a designed state rather than a blank.
  const rep = selectRepById(state, lead.assignedRepId);

  return (
    <PageShell>
      <ProjectHeader lead={lead} progress={progress} />

      {/* "What is happening" beside "who to ask about it" — the two halves of
          the same thought, so they sit on one row. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {features.statusPanel && (
          <div className="lg:col-span-8">
            <ProjectStatus progress={progress} />
          </div>
        )}

        {features.contact && (
          <div className="lg:col-span-4">
            <ContactCard rep={rep} projectName={lead.company} />
          </div>
        )}
      </div>

      {/* Full width. It is the thing the client came for, and two link cards
          side by side need the room to stay side by side. */}
      {features.projectLinks && <ProjectLinks lead={lead} />}

      {/* The detail row: the plan, the news, and the bill. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {features.milestones && (
          <div className="lg:col-span-5">
            <MilestoneTrack milestones={lead.milestones} />
          </div>
        )}

        {features.updates && (
          <div className="lg:col-span-4">
            <UpdatesFeed updates={lead.updates} />
          </div>
        )}

        {features.invoices && (
          <div className="lg:col-span-3">
            <InvoicePanel invoices={lead.invoices} variant="summary" />
          </div>
        )}
      </div>
    </PageShell>
  );
}
