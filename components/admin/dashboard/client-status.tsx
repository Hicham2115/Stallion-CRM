"use client";

import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { StatusDot } from "@/components/deck/status-dot";
import { adminConfig } from "@/config/admin";
import { findStage, pipelineConfig, stageColor } from "@/config/pipeline";
import { formatPercent } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { selectStageCounts } from "@/lib/store/selectors";

const { features, content } = adminConfig.dashboard;

/**
 * Stage breakdown as a list.
 *
 * WHY THIS PANEL IS NOT REDUNDANT. In the prototype it showed the same six
 * numbers as the bar chart beside it — 20 / 16 / 13 / 10 / 14 / 7, twice, in
 * two different shapes. Same pixels, no extra information.
 *
 * So the two panels were given different jobs. The bars carry VOLUME. This list
 * carries FLOW: alongside each count it shows what share of the previous stage
 * ever reached this one. Nothing is invented — it is arithmetic on figures
 * already on screen (see `selectStageCounts`, which explains why it measures
 * "reached this stage or beyond" rather than comparing the two counts directly).
 *
 * Set `features.stageConversion = false` in config/admin.ts to drop back to the
 * literal prototype behaviour.
 */
export function ClientStatus() {
  const { state } = useCrm();
  const counts = selectStageCounts(state);

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title={content.clientStatusTitle}
        hint={
          features.stageConversion
            ? content.clientStatusConversionHint
            : content.clientStatusHint
        }
      />

      <PanelBody className="flex flex-1 flex-col">
        <ul className="flex flex-col gap-4">
          {counts.map((entry) => {
            const stage = findStage(pipelineConfig.stages, entry.id);

            return (
              <li key={entry.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    {/* Decorative: the label next to it carries the meaning,
                        so the dot is never the only way to tell stages apart. */}
                    <StatusDot
                      color={stage ? stageColor(stage) : undefined}
                      className="translate-y-[-1px]"
                    />
                    <span className="truncate text-[0.875rem] text-ink-soft">
                      {entry.label}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-baseline gap-2.5">
                    {features.stageConversion &&
                      entry.conversionFromPrevious !== undefined && (
                        <span
                          // "70%" on its own is ambiguous — of what? The header
                          // hint says it briefly; this says it in full on hover
                          // without spending a line of the panel on it.
                          title={content.conversionTooltip}
                          className="deck-nums cursor-help font-mono text-[0.625rem] tracking-[0.06em] text-ink-muted"
                        >
                          {formatPercent(entry.conversionFromPrevious)}
                        </span>
                      )}
                    <span className="deck-nums font-display text-[0.9375rem] font-semibold text-ink">
                      {entry.count}
                    </span>
                  </span>
                </div>

                {/* Share of all leads. Decorative — the count above is the
                    information, and this restates it as a proportion. */}
                <div
                  aria-hidden
                  className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]"
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: `${entry.share}%`,
                      backgroundColor: stage
                        ? stageColor(stage)
                        : "var(--stage-neutral)",
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </PanelBody>
    </Panel>
  );
}
