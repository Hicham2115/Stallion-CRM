"use client";
import { Radio } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { RankedBarList } from "@/components/deck/ranked-bar-list";
import { reportsConfig } from "@/config/reports";
import { formatPercent } from "@/lib/format";
const { content } = reportsConfig;
export function SourceBreakdown({ rows }) {
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={content.sourceTitle} hint={content.sourceHint}/>

      <PanelBody className="flex flex-1 flex-col">
        {rows.length === 0 ? (<EmptyState icon={Radio} title={content.emptySourceTitle}/>) : (<RankedBarList caption={content.sourcesCaption} rows={rows.map((row) => ({
                id: row.source,
                label: row.source,
                value: String(row.count),
                secondary: formatPercent(row.share),
                share: row.share,
            }))}/>)}
      </PanelBody>
    </Panel>);
}
