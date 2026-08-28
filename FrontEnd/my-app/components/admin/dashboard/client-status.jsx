"use client";
import { useQuery } from "@tanstack/react-query";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { StatusDot } from "@/components/deck/status-dot";
import { adminConfig } from "@/config/admin";
import { LIVE_STAGES, liveStageColor, liveStageCountsOf } from "@/config/pipeline-live";
import { formatPercent } from "@/lib/format";
import { api } from "@/lib/axios";
const { content } = adminConfig.dashboard;
// Real data — GET /api/leads, counted across the real 10-stage pipeline
// (LIVE_STAGES), same query the Clients/Pipeline pages already use (shared
// cache, no extra request). The "stage conversion" chip this used to show
// (share of the previous stage that ever reached this one) needed a
// cumulative-reach figure this doesn't compute — see liveStageCountsOf's
// comment — so this is plain share-of-total now, not a smaller rewrite of
// the same idea.
export function ClientStatus() {
    const { data: leads } = useQuery({
        queryKey: ["leads"],
        queryFn: async () => (await api.get("/api/leads")).data,
    });
    const counts = liveStageCountsOf(leads ?? []);
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={content.clientStatusTitle} hint={content.clientStatusHint}/>

      <PanelBody className="flex flex-1 flex-col">
        <ul className="flex flex-col gap-4">
          {counts.map((entry) => {
            const color = liveStageColor(LIVE_STAGES.find((s) => s.id === entry.id));
            return (<li key={entry.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <StatusDot color={color} className="translate-y-[-1px]"/>
                    <span className="truncate text-[0.875rem] text-ink-soft">
                      {entry.label}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-baseline gap-2.5">
                    <span className="deck-nums font-display text-[0.9375rem] font-semibold text-ink">
                      {entry.count}
                    </span>
                  </span>
                </div>

                <div aria-hidden className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{
                    width: `${entry.share}%`,
                    backgroundColor: color,
                }}/>
                </div>
              </li>);
        })}
        </ul>
      </PanelBody>
    </Panel>);
}
