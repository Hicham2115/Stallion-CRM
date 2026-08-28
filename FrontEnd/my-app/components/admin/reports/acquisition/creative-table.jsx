"use client";
import { Image as ImageIcon } from "lucide-react";
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

function Money({ value }) {
  if (value === null || value === undefined) {
    return <span className="text-ink-muted" title="No matching ad-spend record for this creative">—</span>;
  }
  return <span className="deck-nums">{formatCurrency(Math.round(value))}</span>;
}

export function CreativeTable({ creatives }) {
  return (
    <div className="deck-inset rounded-2xl border border-hairline bg-deck-surface">
      <PanelHeader title="Creative Performance" hint="which creative produces actual customers" />
      <div className="pt-2">
        {creatives.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No creative data"
            description="No leads in this range carry a creative_id value."
            className="py-10"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creative</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Ad Set</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">Won</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creatives.map((row) => (
                <TableRow key={row.creative}>
                  <TableCell className="max-w-[10rem] truncate font-medium text-ink-soft" title={row.creative}>
                    {row.creative}
                  </TableCell>
                  <TableCell className="max-w-[10rem] truncate text-ink-muted" title={row.campaign ?? undefined}>
                    {row.campaign ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[10rem] truncate text-ink-muted" title={row.ad_set ?? undefined}>
                    {row.ad_set ?? "—"}
                  </TableCell>
                  <TableCell className="deck-nums text-right">{formatNumber(row.leads)}</TableCell>
                  <TableCell className="text-right"><Money value={row.spend} /></TableCell>
                  <TableCell className="text-right"><Money value={row.cpl} /></TableCell>
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
