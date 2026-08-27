import Link from "next/link";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { StatusPill } from "@/components/deck/status-pill";
import { portalConfig } from "@/config/portal";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
const { content, features, routes } = portalConfig;
// One component, two densities: variant="summary" is the overview card,
// variant="full" is the Billing screen — kept as one component so the
// outstanding total is computed in exactly one place. Status uses a
// StatusPill (icon + word, not just colour) so Paid/Overdue can't be
// confused in greyscale.
const TONE = {
    paid: "good",
    pending: "warning",
    overdue: "critical",
};
export function InvoicePanel({ invoices, variant = "full", 
/** How many rows the summary shows before deferring to the Billing screen. */
summaryLimit = 3, }) {
    const summary = variant === "summary";
    const outstanding = invoices
        .filter((invoice) => invoice.status !== "paid")
        .reduce((sum, invoice) => sum + invoice.amount, 0);
    // Unpaid first on the summary card; the Billing screen keeps record order.
    const rows = summary
        ? invoices
            .slice()
            .sort((a, b) => Number(a.status === "paid") - Number(b.status === "paid"))
            .slice(0, summaryLimit)
        : invoices;
    const hidden = invoices.length - rows.length;
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={summary ? content.invoices.summaryTitle : content.invoices.title} hint={content.invoices.hint}/>

      <PanelBody className="flex flex-1 flex-col">
        {invoices.length === 0 ? (<EmptyState icon={Receipt} title={content.invoices.emptyTitle} description={content.invoices.emptyDescription}/>) : (<>
            {features.outstandingBalance && (<div className={cn("rounded-xl border p-4", outstanding > 0
                    ? "border-status-critical/25 bg-status-critical/[0.06]"
                    : "border-status-good/25 bg-status-good/[0.06]")}>
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
                  {outstanding > 0
                    ? content.invoices.outstandingLabel
                    : content.invoices.allSettledLabel}
                </p>

                {outstanding > 0 && (<p className="deck-nums mt-1 font-display text-[1.75rem] font-semibold leading-none tracking-[-0.03em]" style={{ color: "var(--status-critical)" }}>
                    {formatCurrency(outstanding)}
                  </p>)}

                {outstanding > 0 && (<p className="mt-2 text-[0.75rem] leading-relaxed text-ink-muted">
                    {content.invoices.payNote}
                  </p>)}
              </div>)}

            <ul className="mt-4 flex flex-col divide-y divide-hairline">
              {rows.map((invoice) => (<li key={invoice.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-3 first:pt-0 last:pb-0">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="deck-nums font-mono text-[0.75rem] text-ink-muted">
                      {invoice.reference}
                    </span>
                    <StatusPill tone={TONE[invoice.status]} label={content.invoices.status[invoice.status]}/>
                  </span>

                  <span className="deck-nums text-[0.875rem] font-medium text-ink">
                    {formatCurrency(invoice.amount)}
                  </span>
                </li>))}
            </ul>

            {summary && hidden > 0 && (<Link href={routes.billing} className="mt-auto inline-flex w-fit pt-4 text-[0.8125rem] font-medium text-ink-muted underline-offset-4 transition-colors hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
                {content.invoices.seeAll}
              </Link>)}
          </>)}
      </PanelBody>
    </Panel>);
}
