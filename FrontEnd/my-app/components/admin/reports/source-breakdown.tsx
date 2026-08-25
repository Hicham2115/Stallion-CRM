"use client";

import { Radio } from "lucide-react";

import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { RankedBarList } from "@/components/deck/ranked-bar-list";
import { reportsConfig } from "@/config/reports";
import { formatPercent } from "@/lib/format";
import type { SourceBreakdown as SourceBreakdownRow } from "@/lib/store/selectors";

const { content } = reportsConfig;

/**
 * Where the leads in the selected range came from.
 *
 * THIS PANEL IS THE REASON THE SEED CHANGED. In the prototype it drew eight
 * bars of identical full width, each labelled "10 (13%)" — a third of the
 * screen spent saying nothing eight times. Two separate faults produced that,
 * and both had to be fixed:
 *
 *   1. the seed assigned sources with `i % 8`, splitting 80 leads into eight
 *      groups of exactly ten (fixed in lib/mock/seed.ts)
 *   2. the bars were scaled against the largest value rather than the total,
 *      so the top bar always filled its track no matter what share it held
 *      (fixed in components/deck/ranked-bar-list.tsx)
 *
 * Either one alone still produces a misleading chart, which is why the plan
 * called for both. Rows are ranked so the panel answers "where does our
 * business actually come from" at a glance.
 */
export function SourceBreakdown({ rows }: { rows: SourceBreakdownRow[] }) {
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title={content.sourceTitle} hint={content.sourceHint} />

      <PanelBody className="flex flex-1 flex-col">
        {rows.length === 0 ? (
          <EmptyState icon={Radio} title={content.emptySourceTitle} />
        ) : (
          <RankedBarList
            caption={content.sourcesCaption}
            rows={rows.map((row) => ({
              id: row.source,
              label: row.source,
              // Count first, share after — the count is the fact and the share
              // is the context. The bar beside it is now exactly this width,
              // which is the whole point of the fix.
              value: String(row.count),
              secondary: formatPercent(row.share),
              share: row.share,
            }))}
          />
        )}
      </PanelBody>
    </Panel>
  );
}
