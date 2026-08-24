import Link from "next/link";
import { Receipt } from "lucide-react";

import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { StatusPill, type StatusTone } from "@/components/deck/status-pill";
import { portalConfig } from "@/config/portal";
import { formatCurrency } from "@/lib/format";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const { content, features, routes } = portalConfig;

/**
 * ============================================================================
 *  INVOICES
 * ============================================================================
 *  What the client has been billed, and what is still owed.
 *
 *  ONE COMPONENT, TWO DENSITIES. `variant="summary"` is the card on the
 *  overview — the outstanding figure, the newest few rows, and a link onward.
 *  `variant="full"` is the Billing screen. Two components would be two places
 *  for the outstanding total to be worked out, and a portal that quotes a
 *  client two different balances on two screens is worse than one with no
 *  billing at all.
 *
 *  THE OUTSTANDING TOTAL IS THE POINT. A list of invoices makes the client add
 *  up the unpaid ones themselves, on the one screen they opened specifically to
 *  avoid doing that.
 *
 *  Status is a StatusPill — icon and word, not just a colour — so "Paid" and
 *  "Overdue" cannot be confused in greyscale or by a colourblind reader. On a
 *  billing screen that is the most expensive possible mistake.
 * ============================================================================
 */

/** Invoice status -> pill tone. Same mapping as the agency side. */
const TONE: Record<InvoiceStatus, StatusTone> = {
  paid: "good",
  pending: "warning",
  overdue: "critical",
};

export function InvoicePanel({
  invoices,
  variant = "full",
  /** How many rows the summary shows before deferring to the Billing screen. */
  summaryLimit = 3,
}: {
  invoices: Invoice[];
  variant?: "summary" | "full";
  summaryLimit?: number;
}) {
  const summary = variant === "summary";

  const outstanding = invoices
    .filter((invoice) => invoice.status !== "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  // Unpaid first on the summary card: the three rows worth showing are the
  // three the client can still do something about. The Billing screen keeps the
  // record in its own order, because that is a statement and statements do not
  // reorder themselves.
  const rows = summary
    ? invoices
        .slice()
        .sort(
          (a, b) =>
            Number(a.status === "paid") - Number(b.status === "paid"),
        )
        .slice(0, summaryLimit)
    : invoices;

  const hidden = invoices.length - rows.length;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title={summary ? content.invoices.summaryTitle : content.invoices.title}
        hint={content.invoices.hint}
      />

      <PanelBody className="flex flex-1 flex-col">
        {invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={content.invoices.emptyTitle}
            description={content.invoices.emptyDescription}
          />
        ) : (
          <>
            {/* ------------------------------------------------------------ */}
            {/* Outstanding — first, because it is the answer                 */}
            {/* ------------------------------------------------------------ */}
            {features.outstandingBalance && (
              <div
                className={cn(
                  "rounded-xl border p-4",
                  outstanding > 0
                    ? "border-status-critical/25 bg-status-critical/[0.06]"
                    : "border-status-good/25 bg-status-good/[0.06]",
                )}
              >
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
                  {outstanding > 0
                    ? content.invoices.outstandingLabel
                    : content.invoices.allSettledLabel}
                </p>

                {outstanding > 0 && (
                  <p
                    className="deck-nums mt-1 font-display text-[1.75rem] font-semibold leading-none tracking-[-0.03em]"
                    style={{ color: "var(--status-critical)" }}
                  >
                    {formatCurrency(outstanding)}
                  </p>
                )}

                {outstanding > 0 && (
                  <p className="mt-2 text-[0.75rem] leading-relaxed text-ink-muted">
                    {content.invoices.payNote}
                  </p>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* The rows                                                      */}
            {/* ------------------------------------------------------------ */}
            <ul className="mt-4 flex flex-col divide-y divide-hairline">
              {rows.map((invoice) => (
                <li
                  key={invoice.id}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-3 first:pt-0 last:pb-0"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="deck-nums font-mono text-[0.75rem] text-ink-muted">
                      {invoice.reference}
                    </span>
                    <StatusPill
                      tone={TONE[invoice.status]}
                      label={content.invoices.status[invoice.status]}
                    />
                  </span>

                  <span className="deck-nums text-[0.875rem] font-medium text-ink">
                    {formatCurrency(invoice.amount)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Only offered when something is actually hidden — a "see all"
                that leads to the same rows is a wasted click. */}
            {summary && hidden > 0 && (
              <Link
                href={routes.billing}
                className="mt-auto inline-flex w-fit pt-4 text-[0.8125rem] font-medium text-ink-muted underline-offset-4 transition-colors hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                {content.invoices.seeAll}
              </Link>
            )}
          </>
        )}
      </PanelBody>
    </Panel>
  );
}
