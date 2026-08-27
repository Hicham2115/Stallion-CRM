"use client";
import { useState } from "react";
import { Columns3, Filter, Columns2 } from "lucide-react";
import { FunnelView } from "@/components/admin/pipeline/funnel-view";
import { PipelineBoard } from "@/components/admin/pipeline/pipeline-board";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { SegmentedControl } from "@/components/deck/segmented-control";
import { boardConfig } from "@/config/board";
import { useCrm } from "@/lib/store/crm-store";
import { PageShell } from "@/components/console/page-shell";
const { content, features } = boardConfig;
// Two views over one dataset, not a filter of one another — a view switch,
// not a toggle that hides columns.
export function PipelineView() {
    const { state } = useCrm();
    const [view, setView] = useState(boardConfig.defaultView);
    const empty = state.leads.length === 0;
    return (<PageShell>
      {features.funnelView && (<div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl label={content.viewSwitchLabel} value={view} onValueChange={setView} options={[
                {
                    value: "kanban",
                    label: content.kanbanLabel,
                    icon: <Columns3 aria-hidden className="size-3.5"/>,
                },
                {
                    value: "funnel",
                    label: content.funnelLabel,
                    icon: <Filter aria-hidden className="size-3.5"/>,
                },
            ]}/>
        </div>)}

      {empty ? (<Panel>
          <EmptyState icon={Columns2} title={content.emptyBoardTitle} description={content.emptyBoardDescription}/>
        </Panel>) : view === "funnel" && features.funnelView ? (<FunnelView />) : (<PipelineBoard />)}
    </PageShell>);
}
