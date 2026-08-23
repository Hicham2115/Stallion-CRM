"use client";

import { PageShell } from "@/components/console/page-shell";
import { ContactCard } from "@/components/portal/contact-card";
import { InvoicePanel } from "@/components/portal/invoice-panel";
import { PortalMissing, PortalSkeleton } from "@/components/portal/portal-states";
import { usePortalLead } from "@/components/portal/use-portal-lead";
import { portalConfig } from "@/config/portal";
import { useCrm } from "@/lib/store/crm-store";
import { selectRepById } from "@/lib/store/selectors";

/**
 * ============================================================================
 *  INVOICES
 * ============================================================================
 *  The full billing history, with the outstanding balance on top.
 *
 *  Same `InvoicePanel` as the overview card, at `variant="full"` — so the
 *  outstanding figure here and the one on the overview are worked out by the
 *  same three lines of arithmetic. Two implementations would eventually quote a
 *  client two different balances, which is the one bug on this screen nobody
 *  would forgive.
 *
 *  The contact card is here for the same reason it is on Files: a billing
 *  question is answered by a person, and making the client hunt for the address
 *  is how an invoice query becomes a complaint.
 * ============================================================================
 */
export function BillingView() {
  const { state } = useCrm();
  const { lead, loading } = usePortalLead();

  if (loading) return <PortalSkeleton />;
  if (!lead) return <PortalMissing />;

  const rep = selectRepById(state, lead.assignedRepId);

  return (
    <PageShell>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <InvoicePanel invoices={lead.invoices} variant="full" />
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
