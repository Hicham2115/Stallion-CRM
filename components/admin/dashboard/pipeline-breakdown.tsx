"use client";

import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { adminConfig } from "@/config/admin";
import { findStage, pipelineConfig, stageColor } from "@/config/pipeline";
import { formatPercent } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { selectStageCounts } from "@/lib/store/selectors";

const { content } = adminConfig.dashboard;

/**
 * The two fixed columns either side of the tracks.
 *
 * They are constants because THREE things have to agree on them: the stage
 * name column, the figures column, and the gridline overlay that has to start
 * where the tracks start and stop where they stop. Three literals would drift
 * the first time someone widened one of them.
 */
const LABEL_COLUMN = "8.5rem";
const FIGURES_COLUMN = "5.5rem";

/**
 * Lead volume by stage.
 *
 * BUILT BY HAND, NOT WITH RECHARTS. A ruled list of bars is a shape, not a
 * chart: Recharts would add a measurement pass, a resize observer and several
 * kilobytes of client JavaScript to draw six rectangles, and would fight us on
 * the rounded data-ends.
 *
 * WHY ROWS AND NOT COLUMNS. This was a row of vertical bars, and vertical bars
 * put the stage name in a column about 6rem wide: "Appointment Set" truncated
 * on every screen, and the labels could not be read without the `title`
 * tooltip. Rows give the name as much width as it needs, right-align the
 * figures into a real column of tabular numerals, and take any number of
 * stages someone adds in config/pipeline.ts without getting thinner.
 *
 * COLOUR. Each track takes its colour from the stage's `tone` in
 * config/pipeline.ts — a position on a sequential lime ramp. The prototype
 * coloured these by hand and the ramp went backwards: "Appointment Set" was
 * darker than "Contacted" despite being further along, so the eye read the
 * progression as noise. A tone index makes it monotonic by construction.
 *
 * WHY "LOST" SITS BELOW THE RULE. It is a different KIND of outcome, not a
 * dimmer kind of winning — which is why it is off the lime ramp in the palette
 * already. Leaving it in the list contradicted that: it read as the sixth step
 * of the funnel. The rule says what the colour says.
 *
 * MEASUREMENT. The quarter gridlines behind the tracks are what let you read a
 * magnitude rather than only a comparison. They are hairlines, not a chart
 * frame — see the "Do" about hairlines in DESIGN.md.
 */
export function PipelineBreakdown() {
  const { state } = useCrm();
  const counts = selectStageCounts(state);

  const isEmpty = counts.every((entry) => entry.count === 0);

  // "Lost" is separated out rather than filtered away: it still gets a row, it
  // just gets it below the rule.
  const lostId = pipelineConfig.stages.find((stage) => stage.isLost)?.id;
  const progression = counts.filter((entry) => entry.id !== lostId);
  const lost = counts.find((entry) => entry.id === lostId);

  // Every track is scaled against the fullest progression stage, so the longest
  // bar always reaches 100% of the available width. Scaling against the grand
  // total instead would leave every bar short and the panel looking empty.
  const progressionMax = Math.max(...progression.map((entry) => entry.count), 1);

  return (
    <Panel ticks className="flex h-full flex-col">
      <PanelHeader
        title={content.pipelineBreakdownTitle}
        hint={content.pipelineBreakdownHint}
      />

      <PanelBody className="flex flex-1 flex-col justify-center">
        {isEmpty ? (
          <EmptyState title={content.emptyPipeline} />
        ) : (
          <div className="relative">
            {/* ---- Quarter gridlines --------------------------------------
                Positioned to span exactly the track area: it starts after the
                name column and stops before the figures column, so a line can
                never appear to run through a number. Hidden below `sm`, where
                the name column is dropped and the geometry no longer holds. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 hidden sm:block"
              style={{ left: LABEL_COLUMN }}
            >
              <div className="relative h-full" style={{ marginRight: FIGURES_COLUMN }}>
                {[0, 25, 50, 75, 100].map((tick) => (
                  <span
                    key={tick}
                    className="absolute top-0 h-full w-px bg-hairline"
                    style={{ left: `${tick}%` }}
                  />
                ))}
              </div>
            </div>

            {/* ---- Progression stages ---- */}
            <ul className="relative">
              {progression.map((entry) => {
                const stage = findStage(pipelineConfig.stages, entry.id);

                return (
                  <li
                    key={entry.id}
                    className="group flex items-center gap-3 py-[0.4375rem]"
                  >
                    <p
                      className="hidden shrink-0 truncate font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted transition-colors group-hover:text-ink-soft sm:block"
                      style={{ width: LABEL_COLUMN }}
                      title={entry.label}
                    >
                      {entry.label}
                    </p>

                    <div className="min-w-0 flex-1">
                      {/* Below `sm` the fixed name column is dropped and the
                          label moves above its own track, so a long stage name
                          never has to share a line with the bar. */}
                      <p className="mb-1 truncate font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted sm:hidden">
                        {entry.label}
                      </p>

                      <div className="h-3.5 w-full overflow-hidden rounded-full bg-white/[0.035]">
                        <div
                          className="h-full rounded-full transition-[width,filter] duration-500 ease-out group-hover:brightness-115"
                          style={{
                            width: `${Math.max(
                              (entry.count / progressionMax) * 100,
                              // Floor, so a stage holding one lead is still a
                              // visible mark rather than a sliver that reads as
                              // zero. Zero itself stays genuinely empty.
                              entry.count > 0 ? 2 : 0,
                            )}%`,
                            backgroundColor: stage
                              ? stageColor(stage)
                              : "var(--stage-neutral)",
                          }}
                        />
                      </div>
                    </div>

                    <div
                      className="flex shrink-0 items-baseline justify-end gap-2"
                      style={{ width: FIGURES_COLUMN }}
                    >
                      <p className="deck-nums font-display text-[1.0625rem] font-semibold leading-none tracking-[-0.02em] text-ink">
                        {entry.count}
                      </p>
                      <p className="deck-nums w-9 text-right font-mono text-[0.625rem] text-ink-muted">
                        {formatPercent(entry.share)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* ---- Lost, below the rule ---- */}
            {lost && (
              <>
                <div aria-hidden className="mt-2 h-px w-full bg-hairline-strong" />

                <div className="group flex items-center gap-3 py-[0.4375rem] pt-1">
                  <p
                    className="hidden shrink-0 truncate font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted sm:block"
                    style={{ width: LABEL_COLUMN }}
                  >
                    {lost.label}
                  </p>

                  <div className="min-w-0 flex-1">
                    <p className="mb-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted sm:hidden">
                      {lost.label}
                    </p>

                    <div className="h-3.5 w-full overflow-hidden rounded-full bg-white/[0.035]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(
                            (lost.count / progressionMax) * 100,
                            lost.count > 0 ? 2 : 0,
                          )}%`,
                          backgroundColor: "var(--stage-neutral)",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    className="flex shrink-0 items-baseline justify-end gap-2"
                    style={{ width: FIGURES_COLUMN }}
                  >
                    <p className="deck-nums font-display text-[1.0625rem] font-semibold leading-none tracking-[-0.02em] text-ink-soft">
                      {lost.count}
                    </p>
                    <p className="deck-nums w-9 text-right font-mono text-[0.625rem] text-ink-muted">
                      {formatPercent(lost.share)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}
