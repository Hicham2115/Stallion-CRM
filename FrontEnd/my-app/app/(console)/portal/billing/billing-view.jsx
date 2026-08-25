"use client";
import { PageShell } from "@/components/console/page-shell";
import { ContactCard } from "@/components/portal/contact-card";
import { InvoicePanel } from "@/components/portal/invoice-panel";
import { PortalMissing, PortalSkeleton } from "@/components/portal/portal-states";
import { usePortalLead } from "@/components/portal/use-portal-lead";
import { portalConfig } from "@/config/portal";
import { useCrm } from "@/lib/store/crm-store";
import { selectRepById } from "@/lib/store/selectors";
// Same InvoicePanel as the overview card, at variant="full", so the
// outstanding figure can't drift between the two screens.
export function BillingView() {
    const { state } = useCrm();
    const { lead, loading } = usePortalLead();
    if (loading)
        return <PortalSkeleton />;
    if (!lead)
        return <PortalMissing />;
    const rep = selectRepById(state, lead.assignedRepId);
    return (<PageShell>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <InvoicePanel invoices={lead.invoices} variant="full"/>
        </div>

        {portalConfig.features.contact && (<div className="lg:col-span-4">
            <ContactCard rep={rep} projectName={lead.company}/>
          </div>)}
      </div>
    </PageShell>);
}
