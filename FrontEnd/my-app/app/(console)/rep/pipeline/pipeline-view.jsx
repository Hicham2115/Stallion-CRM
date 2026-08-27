"use client";
import { useState } from "react";
import { Columns2, Columns3, Filter } from "lucide-react";
import { FunnelView } from "@/components/admin/pipeline/funnel-view";
import { PipelineBoard } from "@/components/admin/pipeline/pipeline-board";
import { PageShell } from "@/components/console/page-shell";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { SegmentedControl } from "@/components/deck/segmented-control";
import { RepMissing, RepSkeleton } from "@/components/rep/rep-states";
import { useRepScope } from "@/components/rep/use-rep-scope";
import { boardConfig } from "@/config/board";
import { repConfig } from "@/config/rep";
const { content, features } = repConfig;
// The admin's PipelineBoard/FunnelView, narrowed by a `leads` prop, so a rep
// and their manager are always looking at the same instrument (a stale
// marker meaning something different on the two screens would make every
// pipeline review start with "whose version is right"). A drop still goes
// through the same moveLeadToStage API — ownership enforcement belongs
// server-side, see config/roles.ts.
export function RepPipelineView() {
    const { leads, loading, rep } = useRepScope();
    const [view, setView] = useState(boardConfig.defaultView);
    if (loading)
        return <RepSkeleton />;
    if (!rep)
        return <RepMissing />;
    const empty = leads.length === 0;
    return (<PageShell>
      {features.funnelView && !empty && (<div className="flex flex-wrap items-center justify-end gap-3">
          <SegmentedControl tone="quiet" label={boardConfig.content.viewSwitchLabel} value={view} onValueChange={setView} options={[
                {
                    value: "kanban",
                    label: boardConfig.content.kanbanLabel,
                    icon: <Columns3 aria-hidden className="size-3.5"/>,
                },
                {
                    value: "funnel",
                    label: boardConfig.content.funnelLabel,
                    icon: <Filter aria-hidden className="size-3.5"/>,
                },
            ]}/>
        </div>)}

      {empty ? (
        <Panel>
          <EmptyState icon={Columns2} title={content.pipeline.emptyTitle} description={content.pipeline.emptyDescription}/>
        </Panel>) : view === "funnel" && features.funnelView ? (<FunnelView leads={leads}/>) : (<PipelineBoard leads={leads}/>)}
    </PageShell>);
}
