"use client";
import { useState } from "react";
import { Columns3, Filter } from "lucide-react";
import { FunnelView } from "@/components/admin/pipeline/funnel-view";
import { LivePipelineBoard } from "@/components/admin/pipeline/live-pipeline-board";
import { SegmentedControl } from "@/components/deck/segmented-control";
import { boardConfig } from "@/config/board";
import { PageShell } from "@/components/console/page-shell";
const { content, features } = boardConfig;
// Kanban is the real pipeline now (leads.stage, live from the API — see
// LivePipelineBoard). Funnel stays on the mock crm-store — the switch is
// disabled via boardConfig.features.funnelView until it's wired to real
// data, not removed here.
export function PipelineView() {
    const [view, setView] = useState(boardConfig.defaultView);
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

      {view === "funnel" && features.funnelView ? <FunnelView /> : <LivePipelineBoard />}
    </PageShell>);
}
