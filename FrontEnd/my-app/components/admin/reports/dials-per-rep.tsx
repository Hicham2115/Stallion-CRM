"use client";

import { PhoneCall } from "lucide-react";

import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { RankedBarList } from "@/components/deck/ranked-bar-list";
import { reportsConfig } from "@/config/reports";
import { formatNumber, formatPercent } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { selectRepEfficiency } from "@/lib/store/selectors";

const { content, features } = reportsConfig;

/**
 * Rep dial volume, ranked, with conversion efficiency alongside.
 *
 * WHY THIS IS NOT THE DASHBOARD LEADERBOARD AGAIN. In the prototype it was
 * exactly that — the same reps, the same dial counts, one screen apart. A
 * report that restates the dashboard is a report nobody opens twice.
 *
 * So this panel earns its place with a second dimension: conversions per 100
 * dials, as a muted figure beside the count. The two together answer a question
 * neither answers alone — the rep with the most dials and the rep who converts
 * best are usually different people, and only this panel shows the gap. Turn it
 * off with features.repEfficiency to fall back to the literal prototype.
 *
 * Dial totals are ALL-TIME and the header says so. Reps carry running counters
 * rather than dated call records, so narrowing them to the date range is not
 * something the data can honestly support — see the note in config/reports.ts.
 */
export function DialsPerRep() {
  const { state } = useCrm();
  const rows = selectRepEfficiency(state);

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title={content.dialsTitle}
        hint={features.repEfficiency ? content.dialsHint : "All-time totals"}
      />

      <PanelBody className="flex flex-1 flex-col">
        {rows.length === 0 ? (
          <EmptyState icon={PhoneCall} title={content.emptyDialsTitle} />
        ) : (
          <RankedBarList
            caption={content.dialsTableCaption}
            rows={rows.map((row) => ({
              id: row.id,
              label: row.name,
              value: formatNumber(row.dials),
              // Share of all dials placed, so bar width is a readable quantity
              // rather than a comparison against whoever happens to lead.
              share: row.share,
              secondary: features.repEfficiency
                ? formatPercent(row.efficiency, 1)
                : undefined,
              secondaryTitle: features.repEfficiency
                ? content.efficiencyTooltip
                : undefined,
            }))}
          />
        )}
      </PanelBody>
    </Panel>
  );
}
