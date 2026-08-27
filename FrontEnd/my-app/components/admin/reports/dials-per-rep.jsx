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
// Adds conversion efficiency (conversions per 100 dials) beside the dial
// count so this earns its place beyond restating the dashboard leaderboard —
// the rep with the most dials and the rep who converts best are usually
// different people. Dial totals are all-time (reps carry running counters,
// not dated call records) — see config/reports.ts.
export function DialsPerRep() {
    const { state } = useCrm();
    const rows = selectRepEfficiency(state);
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={content.dialsTitle} hint={features.repEfficiency ? content.dialsHint : "All-time totals"}/>

      <PanelBody className="flex flex-1 flex-col">
        {rows.length === 0 ? (<EmptyState icon={PhoneCall} title={content.emptyDialsTitle}/>) : (<RankedBarList caption={content.dialsTableCaption} rows={rows.map((row) => ({
                id: row.id,
                label: row.name,
                value: formatNumber(row.dials),
                share: row.share,
                secondary: features.repEfficiency
                    ? formatPercent(row.efficiency, 1)
                    : undefined,
                secondaryTitle: features.repEfficiency
                    ? content.efficiencyTooltip
                    : undefined,
            }))}/>)}
      </PanelBody>
    </Panel>);
}
