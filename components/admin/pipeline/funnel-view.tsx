"use client";

import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { boardConfig } from "@/config/board";
import { findStage, pipelineConfig, stageColor } from "@/config/pipeline";
import { formatPercent } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { selectStageCounts } from "@/lib/store/selectors";

const { content } = boardConfig;

/**
 * ============================================================================
 *  FUNNEL VIEW
 * ============================================================================
 *  The same pipeline drawn as drop-off rather than as columns.
 *
 *  NO NEW ARITHMETIC. This is built entirely from `selectStageCounts`, which
 *  already computes stage-to-stage conversion for the dashboard's Client Status
 *  panel — the funnel is that data drawn a second way. Sharing the selector is
 *  what guarantees the funnel and the dashboard can never disagree, and it is
 *  why the panel documents its own formula there rather than here.
 *
 *  Bar width is REACH — how many leads ever got this far — not the count
 *  sitting in the stage right now. A lead currently marked Client has already
 *  passed through Attended, and drawing only the current occupants would make
 *  the funnel widen partway down, which is not a funnel. `selectStageCounts`
 *  explains this at length; the important part here is that the width and the
 *  drop-off percentage share one definition.
 *
 *  Terminal losses are excluded. Lost is not a step in the funnel — including
 *  it is the same mistake as the seventh kanban column.
 * ============================================================================
 */
export function FunnelView() {
  const { state } = useCrm();
  const counts = selectStageCounts(state);

  // Progression only, in order. `conversionFromPrevious` is already scoped to
  // this same set by the selector.
  const steps = counts.filter((entry) => {
    const stage = findStage(pipelineConfig.stages, entry.id);
    return !stage?.isLost;
  });

  // Reach at each step, derived by walking backwards: a lead in a later stage
  // passed through every earlier one.
  const reach = steps.map((_, index) =>
    steps.slice(index).reduce((sum, entry) => sum + entry.count, 0),
  );

  const widest = reach[0] || 1;

  return (
    <Panel>
      <PanelHeader title={content.funnelTitle} hint={content.funnelHint} />

      <PanelBody>
        <ol className="flex flex-col gap-4">
          {steps.map((entry, index) => {
            const stage = findStage(pipelineConfig.stages, entry.id);
            const width = (reach[index] / widest) * 100;

            // Drop-off is the complement of the conversion into this step.
            const dropOff =
              entry.conversionFromPrevious !== undefined
                ? 100 - entry.conversionFromPrevious
                : undefined;

            return (
              <li key={entry.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[0.875rem] text-ink-soft">
                    {entry.label}
                  </span>

                  <span className="flex shrink-0 items-baseline gap-3">
                    {dropOff !== undefined && dropOff > 0 && (
                      <span className="deck-nums font-mono text-[0.625rem] tracking-[0.06em] text-[var(--status-warning)]">
                        −{formatPercent(dropOff)} {content.funnelDropOffLabel}
                      </span>
                    )}
                    <span
                      title={`${reach[index]} ${content.funnelReachedLabel}`}
                      className="deck-nums cursor-help font-display text-[1.0625rem] font-semibold text-ink"
                    >
                      {reach[index]}
                    </span>
                  </span>
                </div>

                {/* The funnel body. Centred so the taper reads as a funnel
                    rather than a left-aligned bar chart — which is the one
                    thing this view offers that the kanban does not. */}
                <div
                  aria-hidden
                  className="mt-2 flex h-7 justify-center overflow-hidden rounded-md bg-white/[0.03]"
                >
                  <div
                    className="h-full rounded-md transition-[width] duration-700 ease-out"
                    style={{
                      width: `${width}%`,
                      backgroundColor: stage
                        ? stageColor(stage)
                        : "var(--stage-neutral)",
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </PanelBody>
    </Panel>
  );
}
