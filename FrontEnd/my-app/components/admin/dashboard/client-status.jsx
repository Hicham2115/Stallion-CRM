"use client";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { StatusDot } from "@/components/deck/status-dot";
import { adminConfig } from "@/config/admin";
import { findStage, pipelineConfig, stageColor } from "@/config/pipeline";
import { formatPercent } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { selectStageCounts } from "@/lib/store/selectors";
const { features, content } = adminConfig.dashboard;
// The bars beside this carry volume; this list carries flow — the share of
// the previous stage that ever reached this one (see selectStageCounts).
// Set features.stageConversion = false in config/admin.ts to drop that.
export function ClientStatus() {
    const { state } = useCrm();
    const counts = selectStageCounts(state);
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={content.clientStatusTitle} hint={features.stageConversion
            ? content.clientStatusConversionHint
            : content.clientStatusHint}/>

      <PanelBody className="flex flex-1 flex-col">
        <ul className="flex flex-col gap-4">
          {counts.map((entry) => {
            const stage = findStage(pipelineConfig.stages, entry.id);
            return (<li key={entry.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <StatusDot color={stage ? stageColor(stage) : undefined} className="translate-y-[-1px]"/>
                    <span className="truncate text-[0.875rem] text-ink-soft">
                      {entry.label}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-baseline gap-2.5">
                    {features.stageConversion &&
                    entry.conversionFromPrevious !== undefined && (<span title={content.conversionTooltip} className="deck-nums cursor-help font-mono text-[0.625rem] tracking-[0.06em] text-ink-muted">
                          {formatPercent(entry.conversionFromPrevious)}
                        </span>)}
                    <span className="deck-nums font-display text-[0.9375rem] font-semibold text-ink">
                      {entry.count}
                    </span>
                  </span>
                </div>

                <div aria-hidden className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{
                    width: `${entry.share}%`,
                    backgroundColor: stage
                        ? stageColor(stage)
                        : "var(--stage-neutral)",
                }}/>
                </div>
              </li>);
        })}
        </ul>
      </PanelBody>
    </Panel>);
}
