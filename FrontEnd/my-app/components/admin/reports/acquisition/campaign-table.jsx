"use client";
import { Megaphone } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PanelHeader } from "@/components/deck/panel";
import { EmptyState } from "@/components/deck/empty-state";
import { formatCurrency, formatNumber } from "@/lib/format";

// spend/cpl are null whenever no ad_spend row's campaign string matches
// this row's utm_campaign exactly (see KpiService::campaignPerformance
// doc) — rendered as "—", never 0 or a computed guess, so a campaign that
// simply has no matching spend record doesn't read as a free/zero-cost one.
function Money({ value }) {
  if (value === null || value === undefined) {
    return <span className="text-ink-muted" title="No matching ad-spend record for this campaign name">—</span>;
  }
  return <span className="deck-nums">{formatCurrency(Math.round(value))}</span>;
}

export function CampaignTable({ campaigns }) {
  return (
    <div className="deck-inset rounded-2xl border border-hairline bg-deck-surface">
      <PanelHeader title="Campaign Performance" hint="ranked by leads" />
      <div className="pt-2">
        {campaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No campaign data"
            description="No leads in this range carry a utm_campaign value."
            className="py-10"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">Consults</TableHead>
                <TableHead className="text-right">Won</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((row) => (
                <TableRow key={row.campaign}>
                  <TableCell className="max-w-[16rem] truncate font-medium text-ink-soft" title={row.campaign}>
                    {row.campaign}
                  </TableCell>
                  <TableCell className="deck-nums text-right">{formatNumber(row.leads)}</TableCell>
                  <TableCell className="text-right"><Money value={row.spend} /></TableCell>
                  <TableCell className="text-right"><Money value={row.cpl} /></TableCell>
                  <TableCell className="deck-nums text-right">{formatNumber(row.consults)}</TableCell>
                  <TableCell className="deck-nums text-right">{formatNumber(row.won)}</TableCell>
                  <TableCell className="text-right"><Money value={row.revenue} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
