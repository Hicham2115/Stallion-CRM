import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { StatusPill } from "@/components/deck/status-pill";
import { leadConfig } from "@/config/lead";
import { formatCurrency } from "@/lib/format";
const { content, features } = leadConfig;
const TONE = {
    paid: "good",
    pending: "warning",
    overdue: "critical",
};
export function InvoicesPanel({ invoices }) {
    const outstanding = invoices
        .filter((invoice) => invoice.status !== "paid")
        .reduce((sum, invoice) => sum + invoice.amount, 0);
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={content.invoicesTitle} hint={content.invoicesHint}/>

      <PanelBody className="flex flex-1 flex-col">
        {invoices.length === 0 ? (<EmptyState icon={Receipt} title={content.invoicesEmptyTitle} description={content.invoicesEmptyDescription}/>) : (<>
            <ul className="flex flex-col gap-3">
              {invoices.map((invoice) => (<li key={invoice.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="deck-nums font-mono text-[0.75rem] text-ink-muted">
                      {invoice.reference}
                    </span>
                    <StatusPill tone={TONE[invoice.status]} label={content.invoiceStatus[invoice.status]}/>
                  </span>

                  <span className="deck-nums text-[0.875rem] font-medium text-ink">
                    {formatCurrency(invoice.amount)}
                  </span>
                </li>))}
            </ul>

            {features.invoiceOutstanding && (<div className="mt-auto flex items-baseline justify-between gap-3 border-t border-hairline pt-4 mt-4">
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
                  {outstanding > 0
                    ? content.outstandingLabel
                    : content.allSettledLabel}
                </span>

                {outstanding > 0 && (<span className="deck-nums font-display text-[1.0625rem] font-semibold text-[var(--status-critical)]">
                    {formatCurrency(outstanding)}
                  </span>)}
              </div>)}
          </>)}
      </PanelBody>
    </Panel>);
}
