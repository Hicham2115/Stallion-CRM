import { ListChecks } from "lucide-react";

import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { StatusPill } from "@/components/deck/status-pill";
import { leadConfig } from "@/config/lead";
import { template } from "@/lib/format";
import type { Milestone, MilestoneStatus } from "@/lib/types";

const { content, features } = leadConfig;

/** Milestone status -> the pill tone. Done is a win, in-progress is waiting,
 *  pending is simply not started — never an error. */
const TONE: Record<MilestoneStatus, "good" | "warning" | "neutral"> = {
  done: "good",
  in_progress: "warning",
  pending: "neutral",
};

/**
 * Delivery milestones for a converted client.
 *
 * THE SUMMARY LINE IS THE ADDITION. The prototype listed four milestones with
 * four status pills and no total, so "how far along is this project" — the only
 * question the panel exists to answer — required counting pills. "2 of 4
 * complete" plus a progress rail answers it before you read a single row.
 *
 * The rail is decorative and hidden from screen readers: the summary text above
 * it already states the same thing, and announcing it twice helps nobody.
 */
export function MilestonesPanel({ milestones }: { milestones: Milestone[] }) {
  const done = milestones.filter((entry) => entry.status === "done").length;
  const total = milestones.length;
  const progress = total === 0 ? 0 : (done / total) * 100;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title={content.milestonesTitle}
        hint={content.milestonesHint}
      />

      <PanelBody className="flex flex-1 flex-col">
        {total === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={content.milestonesEmptyTitle}
            description={content.milestonesEmptyDescription}
          />
        ) : (
          <>
            {features.milestoneProgress && (
              <div className="mb-5">
                <p className="deck-nums text-[0.8125rem] text-ink-soft">
                  {template(content.milestoneSummary, { done, total })}
                </p>
                <div
                  aria-hidden
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]"
                >
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <ul className="flex flex-col gap-3">
              {milestones.map((milestone) => (
                <li
                  key={milestone.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="min-w-0 truncate text-[0.875rem] text-ink-soft">
                    {milestone.label}
                  </span>
                  <StatusPill
                    tone={TONE[milestone.status]}
                    label={content.milestoneStatus[milestone.status]}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </PanelBody>
    </Panel>
  );
}
