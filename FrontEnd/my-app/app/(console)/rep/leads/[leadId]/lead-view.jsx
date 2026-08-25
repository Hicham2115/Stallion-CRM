"use client";
import { ActivityTimeline } from "@/components/admin/lead/activity-timeline";
import { ContactPanel } from "@/components/admin/lead/contact-panel";
import { NotesPanel } from "@/components/admin/lead/notes-panel";
import { PageShell } from "@/components/console/page-shell";
import { useSetPageTitle } from "@/components/console/page-title";
import { RepLeadHeader } from "@/components/rep/rep-lead-header";
import { RepLeadBlocked, RepMissing, RepSkeleton, } from "@/components/rep/rep-states";
import { useRepScope } from "@/components/rep/use-rep-scope";
import { repConfig } from "@/config/rep";
import { useCrm } from "@/lib/store/crm-store";
import { selectLeadById } from "@/lib/store/selectors";
const { content, routes } = repConfig;
// The one rep route that takes an id from the URL, so ownership is checked
// first: a lead that isn't the rep's own gets a "not yours" screen, kept
// separate from "not found" so a reassignment never looks like a bug (this
// isn't real security yet — that lands when the API refuses to serve the
// record; see config/roles.ts). Contact/Activity/Notes are shared with the
// admin lead page; Milestones/Files/Invoices are the delivery-team half and
// are deliberately left out here.
export function RepLeadView({ leadId }) {
    const { state } = useCrm();
    const { rep } = useRepScope();
    const lead = selectLeadById(state, leadId);
    useSetPageTitle({
        title: lead?.name ?? null,
        subtitle: lead?.company ?? null,
        parent: { label: content.lead.back, href: routes.pipeline },
    });
    // A record we can already see renders immediately (server-side included);
    // only an unresolved id waits a frame for hydration, since it may be a
    // lead that lives solely in persisted state.
    if ((!lead || !rep) && !state.hydrated)
        return <RepSkeleton />;
    if (!rep)
        return <RepMissing />;
    if (!lead)
        return <RepLeadBlocked reason="missing"/>;
    if (lead.assignedRepId !== rep.id) {
        return <RepLeadBlocked reason="forbidden"/>;
    }
    return (<PageShell>
      <RepLeadHeader lead={lead}/>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ContactPanel lead={lead}/>
        <ActivityTimeline activity={lead.activity}/>
        <NotesPanel leadId={lead.id} notes={lead.notes}/>
      </div>
    </PageShell>);
}
