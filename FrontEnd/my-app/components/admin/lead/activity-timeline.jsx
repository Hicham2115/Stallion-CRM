import { Activity } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { leadConfig } from "@/config/lead";
import { formatDaysAgo } from "@/lib/format";
const { content } = leadConfig;
// A hairline spine runs through the dots so the eye reads the entries as one
// ordered story rather than assembling six separate rows by timestamp.
// Entries are stored oldest-first, so the timeline reads top to bottom.
export function ActivityTimeline({ activity }) {
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={content.activityTitle} hint={content.activityHint}/>

      <PanelBody className="flex flex-1 flex-col">
        {activity.length === 0 ? (<EmptyState icon={Activity} title={content.activityEmpty}/>) : (<ol className="relative flex flex-col gap-5">
            {activity.map((event, index) => {
                const last = index === activity.length - 1;
                return (<li key={event.id} className="relative flex gap-3.5">
                  {/* Spine segment drawn per-item, not one absolute rule, so
                      it stops exactly at the last dot. */}
                  <span aria-hidden className="relative flex w-2 shrink-0 justify-center">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ring-4 ring-deck-surface ${last ? "bg-brand" : "bg-ink-faint"}`}/>
                    {!last && (<span className="absolute left-1/2 top-4 h-[calc(100%+0.75rem)] w-px -translate-x-1/2 bg-hairline"/>)}
                  </span>

                  <div className="min-w-0 flex-1 pb-0.5">
                    <p className="text-[0.875rem] leading-snug text-ink-soft">
                      {event.label}
                    </p>
                    <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted">
                      {formatDaysAgo(event.daysAgo)}
                    </p>
                  </div>
                </li>);
            })}
          </ol>)}
      </PanelBody>
    </Panel>);
}
