"use client";

import { notFound } from "next/navigation";

import { ActivityTimeline } from "@/components/admin/lead/activity-timeline";
import { ContactPanel } from "@/components/admin/lead/contact-panel";
import { FilesPanel } from "@/components/admin/lead/files-panel";
import { InvoicesPanel } from "@/components/admin/lead/invoices-panel";
import { LeadHeader } from "@/components/admin/lead/lead-header";
import { MilestonesPanel } from "@/components/admin/lead/milestones-panel";
import { NotesPanel } from "@/components/admin/lead/notes-panel";
import { useSetPageTitle } from "@/components/console/page-title";
import { Panel } from "@/components/deck/panel";
import { leadConfig } from "@/config/lead";
import { useCrm } from "@/lib/store/crm-store";
import { selectLeadById } from "@/lib/store/selectors";
import { PageShell } from "@/components/console/page-shell";

const { content, features } = leadConfig;

/**
 * ============================================================================
 *  LEAD DETAIL
 * ============================================================================
 *  Everything known about one lead: identity, contact, history, notes, and —
 *  once they convert — their project, files and billing.
 *
 *  WHY notFound() IS GUARDED BY `hydrated`. The store starts from the seed on
 *  the server AND on the first client render, then swaps in persisted state in
 *  an effect (see lib/store/crm-store.tsx). A client the user added themselves
 *  exists only in that persisted state, so calling notFound() on the first
 *  render would 404 every record created since the seed — the newest data
 *  would be the data that appears broken.
 *
 *  So the guard is applied to the MISSING case only, not to the page as a
 *  whole: a lead that is already visible renders straight away (server-side
 *  included), and only an unresolved id waits a frame for hydration before
 *  being declared absent. Guarding the whole page instead would trade a
 *  server-rendered record for a skeleton on every single lead.
 *
 *  PANELS ARE NOT ALL RELEVANT TO ALL LEADS. Milestones, Files and Invoices
 *  only mean anything once a lead converts, so each renders a designed empty
 *  state explaining that rather than an empty box that reads as a failed load.
 * ============================================================================
 */
export function LeadDetailView({ leadId }: { leadId: string }) {
  const { state } = useCrm();
  const lead = selectLeadById(state, leadId);

  // Put the record's name in the topbar, with a breadcrumb back to the list.
  // Null while loading, so the route title ("Clients") shows in the meantime
  // rather than an empty bar.
  useSetPageTitle({
    title: lead?.name ?? null,
    subtitle: lead?.company ?? null,
    parent: { label: content.backToClients, href: "/admin/clients" },
  });

  // Order matters here. A lead we can already see is rendered immediately —
  // including on the server, since the seed is present there — so the common
  // case gets real server-rendered content and no skeleton flash.
  //
  // Only a MISSING lead has to wait: it may be a record the user created, which
  // lives in persisted state and has not been read yet. Once hydration is done,
  // missing genuinely means missing.
  if (!lead) {
    if (!state.hydrated) return <LeadDetailSkeleton />;

    // Throws to the nearest not-found boundary, which is the not-found.tsx
    // beside this file. A stale bookmark gets a designed page, not a crash.
    notFound();
  }

  return (
    <PageShell>
      <LeadHeader lead={lead} />

      {/* Contact and activity: the two things you need when the record is open
          because you are about to call someone. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <ContactPanel lead={lead} />
        </div>

        {features.activity && (
          <div className="lg:col-span-4">
            <ActivityTimeline activity={lead.activity} />
          </div>
        )}

        {features.notes && (
          <div className="lg:col-span-4">
            <NotesPanel leadId={lead.id} notes={lead.notes} />
          </div>
        )}
      </div>

      {/* Delivery and billing — the post-conversion half of the record. */}
      {(features.milestones || features.files || features.invoices) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {features.milestones && (
            <MilestonesPanel milestones={lead.milestones} />
          )}
          {features.files && <FilesPanel files={lead.files} />}
          {features.invoices && <InvoicesPanel invoices={lead.invoices} />}
        </div>
      )}
    </PageShell>
  );
}

/** Matches the real layout's shape so the page does not jump when data lands. */
function LeadDetailSkeleton() {
  return (
    <PageShell>
      <Panel className="h-[11rem] animate-pulse" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="h-[16rem] animate-pulse" />
        <Panel className="h-[16rem] animate-pulse" />
        <Panel className="h-[16rem] animate-pulse" />
      </div>
    </PageShell>
  );
}
