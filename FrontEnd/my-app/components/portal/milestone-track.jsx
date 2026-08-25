import { ListChecks } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { StatusPill } from "@/components/deck/status-pill";
import { portalConfig } from "@/config/portal";
import { formatShortDate, template } from "@/lib/format";
import { cn } from "@/lib/utils";
const { content, features } = portalConfig;
// Renders as a track (spine + markers), not the flat list the admin's
// milestones-panel uses — a client reads their plan once and wants to see
// where they are along it. Deliberately does NOT flag a passed target date
// as overdue/red the way the dev workspace does: that conversation belongs
// in the updates feed, written by a person, not painted on every page load.
const TONE = {
    done: "good",
    in_progress: "warning",
    pending: "neutral",
};
/** The marker on the spine for each state. */
const MARKER = {
    done: "border-status-good bg-status-good",
    in_progress: "border-status-warning bg-deck-surface",
    pending: "border-hairline-strong bg-deck-surface",
};
export function MilestoneTrack({ milestones }) {
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={content.milestones.title} hint={content.milestones.hint}/>

      <PanelBody className="flex flex-1 flex-col">
        {milestones.length === 0 ? (<EmptyState icon={ListChecks} title={content.milestones.emptyTitle} description={content.milestones.emptyDescription}/>) : (<ol className="flex flex-col">
            {milestones.map((milestone, index) => {
                const last = index === milestones.length - 1;
                // The connector belongs to the step above it — lit only when
                // that step is finished, so the spine fills in behind, not ahead.
                const connectorLit = milestone.status === "done";
                return (<li key={milestone.id} className="flex gap-3.5">
                  <div aria-hidden className="flex w-3 shrink-0 flex-col items-center">
                    <span className={cn("mt-1 size-3 shrink-0 rounded-full border-2", MARKER[milestone.status])}/>
                    {!last && (<span className={cn("w-px flex-1", connectorLit ? "bg-status-good/35" : "bg-hairline")}/>)}
                  </div>

                  {/* Marker is decorative — the pill beside it carries state
                      via an icon and a word so it survives greyscale/colour
                      blindness/print. */}
                  <div className={cn("flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1.5", last ? "pb-0" : "pb-5")}>
                    <span className="min-w-0">
                      <span className={cn("block truncate text-[0.875rem]", milestone.status === "pending"
                        ? "text-ink-muted"
                        : "text-ink-soft")}>
                        {milestone.label}
                      </span>

                      {features.stepTargetDates &&
                        milestone.status !== "done" &&
                        milestone.targetDate && (<span className="deck-nums mt-0.5 block font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
                            {template(content.milestones.expectedBy, {
                            date: formatShortDate(milestone.targetDate),
                        })}
                          </span>)}
                    </span>

                    <StatusPill tone={TONE[milestone.status]} label={content.milestones.status[milestone.status]}/>
                  </div>
                </li>);
            })}
          </ol>)}
      </PanelBody>
    </Panel>);
}
