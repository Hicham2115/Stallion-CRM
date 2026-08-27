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
// notFound() is guarded by `hydrated` rather than called on first render:
// the store starts from the seed on server + first client render, then
// swaps in persisted state in an effect, so a client the user just added
// would 404 until that swap happens. A lead already visible renders
// immediately (server-side included); only an unresolved id waits a frame.
export function LeadDetailView({ leadId }) {
    const { state } = useCrm();
    const lead = selectLeadById(state, leadId);
    useSetPageTitle({
        title: lead?.name ?? null,
        subtitle: lead?.company ?? null,
        parent: { label: content.backToClients, href: "/admin/clients" },
    });
    if (!lead) {
        if (!state.hydrated)
            return <LeadDetailSkeleton />;
        // Throws to the not-found.tsx boundary beside this file.
        notFound();
    }
    return (<PageShell>
      <LeadHeader lead={lead}/>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <ContactPanel lead={lead}/>
        </div>

        {features.activity && (<div className="lg:col-span-4">
            <ActivityTimeline activity={lead.activity}/>
          </div>)}

        {features.notes && (<div className="lg:col-span-4">
            <NotesPanel leadId={lead.id} notes={lead.notes}/>
          </div>)}
      </div>

      {(features.milestones || features.files || features.invoices) && (<div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {features.milestones && (<MilestonesPanel milestones={lead.milestones}/>)}
          {features.files && <FilesPanel files={lead.files}/>}
          {features.invoices && <InvoicesPanel invoices={lead.invoices}/>}
        </div>)}
    </PageShell>);
}
// Matches the real layout's shape so the page doesn't jump when data lands.
function LeadDetailSkeleton() {
    return (<PageShell>
      <Panel className="h-[11rem] animate-pulse"/>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="h-[16rem] animate-pulse"/>
        <Panel className="h-[16rem] animate-pulse"/>
        <Panel className="h-[16rem] animate-pulse"/>
      </div>
    </PageShell>);
}
