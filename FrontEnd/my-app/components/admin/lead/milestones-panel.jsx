import { ListChecks } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { StatusPill } from "@/components/deck/status-pill";
import { leadConfig } from "@/config/lead";
import { template } from "@/lib/format";
const { content, features } = leadConfig;
const TONE = {
    done: "good",
    in_progress: "warning",
    pending: "neutral",
};
export function MilestonesPanel({ milestones }) {
    const done = milestones.filter((entry) => entry.status === "done").length;
    const total = milestones.length;
    const progress = total === 0 ? 0 : (done / total) * 100;
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={content.milestonesTitle} hint={content.milestonesHint}/>

      <PanelBody className="flex flex-1 flex-col">
        {total === 0 ? (<EmptyState icon={ListChecks} title={content.milestonesEmptyTitle} description={content.milestonesEmptyDescription}/>) : (<>
            {features.milestoneProgress && (<div className="mb-5">
                <p className="deck-nums text-[0.8125rem] text-ink-soft">
                  {template(content.milestoneSummary, { done, total })}
                </p>
                <div aria-hidden className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }}/>
                </div>
              </div>)}

            <ul className="flex flex-col gap-3">
              {milestones.map((milestone) => (<li key={milestone.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-[0.875rem] text-ink-soft">
                    {milestone.label}
                  </span>
                  <StatusPill tone={TONE[milestone.status]} label={content.milestoneStatus[milestone.status]}/>
                </li>))}
            </ul>
          </>)}
      </PanelBody>
    </Panel>);
}
