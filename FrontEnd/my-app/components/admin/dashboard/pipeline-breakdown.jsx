"use client";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { adminConfig } from "@/config/admin";
import { findStage, pipelineConfig, stageColor } from "@/config/pipeline";
import { formatPercent } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { stageCountsOf } from "@/lib/store/selectors";
const { content } = adminConfig.dashboard;
// Constants because the name column, figures column, and gridline overlay
// all have to agree on where the track area starts and stops.
const LABEL_COLUMN = "8.5rem";
const FIGURES_COLUMN = "5.5rem";
// Built by hand rather than with Recharts — it's a ruled list of bars, not a
// chart. Rows (not columns) so long stage names get real width instead of
// truncating. Track colour comes from each stage's `tone` in
// config/pipeline.ts, a position on a sequential ramp, so the progression
// reads as monotonic rather than random. "Lost" renders below the rule since
// it's a different kind of outcome, not a dimmer kind of winning.
export function PipelineBreakdown({
leads,
/** Override the heading — the rep dashboard calls this "My Leads by Stage". */
title = content.pipelineBreakdownTitle, hint = content.pipelineBreakdownHint, } = {}) {
    const { state } = useCrm();
    const counts = stageCountsOf(leads ?? state.leads, state.stageOrder);
    const isEmpty = counts.every((entry) => entry.count === 0);
    // "Lost" is separated out rather than filtered away — it still gets a
    // row, just below the rule.
    const lostId = pipelineConfig.stages.find((stage) => stage.isLost)?.id;
    const progression = counts.filter((entry) => entry.id !== lostId);
    const lost = counts.find((entry) => entry.id === lostId);
    // Scaled against the fullest progression stage (not the grand total) so
    // the longest bar reaches 100% of the available width.
    const progressionMax = Math.max(...progression.map((entry) => entry.count), 1);
    return (<Panel ticks className="flex h-full flex-col">
      <PanelHeader title={title} hint={hint}/>

      <PanelBody className="flex flex-1 flex-col justify-center">
        {isEmpty ? (<EmptyState title={content.emptyPipeline}/>) : (<div className="relative">
            {/* Spans exactly the track area (between the name and figures
                columns) so a gridline never runs through a number. Hidden
                below `sm`, where the name column is dropped. */}
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden sm:block" style={{ left: LABEL_COLUMN }}>
              <div className="relative h-full" style={{ marginRight: FIGURES_COLUMN }}>
                {[0, 25, 50, 75, 100].map((tick) => (<span key={tick} className="absolute top-0 h-full w-px bg-hairline" style={{ left: `${tick}%` }}/>))}
              </div>
            </div>

            <ul className="relative">
              {progression.map((entry) => {
                const stage = findStage(pipelineConfig.stages, entry.id);
                return (<li key={entry.id} className="group flex items-center gap-3 py-[0.4375rem]">
                    <p className="hidden shrink-0 truncate font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted transition-colors group-hover:text-ink-soft sm:block" style={{ width: LABEL_COLUMN }} title={entry.label}>
                      {entry.label}
                    </p>

                    <div className="min-w-0 flex-1">
                      <p className="mb-1 truncate font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted sm:hidden">
                        {entry.label}
                      </p>

                      <div className="h-3.5 w-full overflow-hidden rounded-full bg-white/[0.035]">
                        <div className="h-full rounded-full transition-[width,filter] duration-500 ease-out group-hover:brightness-115" style={{
                        width: `${Math.max((entry.count / progressionMax) * 100,
                        // Floor so one lead is still a visible mark, not a sliver.
                        entry.count > 0 ? 2 : 0)}%`,
                        backgroundColor: stage
                            ? stageColor(stage)
                            : "var(--stage-neutral)",
                    }}/>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-baseline justify-end gap-2" style={{ width: FIGURES_COLUMN }}>
                      <p className="deck-nums font-display text-[1.0625rem] font-semibold leading-none tracking-[-0.02em] text-ink">
                        {entry.count}
                      </p>
                      <p className="deck-nums w-9 text-right font-mono text-[0.625rem] text-ink-muted">
                        {formatPercent(entry.share)}
                      </p>
                    </div>
                  </li>);
            })}
            </ul>

            {lost && (<>
                <div aria-hidden className="mt-2 h-px w-full bg-hairline-strong"/>

                <div className="group flex items-center gap-3 py-[0.4375rem] pt-1">
                  <p className="hidden shrink-0 truncate font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted sm:block" style={{ width: LABEL_COLUMN }}>
                    {lost.label}
                  </p>

                  <div className="min-w-0 flex-1">
                    <p className="mb-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted sm:hidden">
                      {lost.label}
                    </p>

                    <div className="h-3.5 w-full overflow-hidden rounded-full bg-white/[0.035]">
                      <div className="h-full rounded-full" style={{
                    width: `${Math.max((lost.count / progressionMax) * 100, lost.count > 0 ? 2 : 0)}%`,
                    backgroundColor: "var(--stage-neutral)",
                }}/>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-baseline justify-end gap-2" style={{ width: FIGURES_COLUMN }}>
                    <p className="deck-nums font-display text-[1.0625rem] font-semibold leading-none tracking-[-0.02em] text-ink-soft">
                      {lost.count}
                    </p>
                    <p className="deck-nums w-9 text-right font-mono text-[0.625rem] text-ink-muted">
                      {formatPercent(lost.share)}
                    </p>
                  </div>
                </div>
              </>)}
          </div>)}
      </PanelBody>
    </Panel>);
}
