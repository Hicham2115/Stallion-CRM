import { ListChecks } from "lucide-react";

import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { StatusPill, type StatusTone } from "@/components/deck/status-pill";
import { portalConfig } from "@/config/portal";
import { formatShortDate, template } from "@/lib/format";
import type { Milestone, MilestoneStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const { content, features } = portalConfig;

/**
 * ============================================================================
 *  PROJECT STAGES
 * ============================================================================
 *  The client's view of the delivery plan.
 *
 *  A TRACK, NOT A LIST. The admin's version of this panel
 *  (components/admin/lead/milestones-panel.tsx) is a flat list of rows, which
 *  is right for someone scanning fourteen client records a day. A client reads
 *  their own plan once and wants to know where along it they are, so this draws
 *  the sequence: a spine down the left, filled behind them and hollow ahead.
 *
 *  Same tone mapping as the admin panel, deliberately — "done is good, in
 *  progress is waiting, not started is neutral" has to mean the same thing on
 *  both sides of the product, or the agency and the client are reading two
 *  different charts of the same project.
 *
 *  Only the WORDS differ: `content.milestones.status` in config/portal.ts says
 *  "Not started" where the agency screen says "Pending", because pending sounds
 *  like something is waiting on the client, and none of these are.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  TARGET DATES ARE SHOWN. LATENESS IS NOT FLAGGED.
 *  ─────────────────────────────────────────────────────────────────────────
 *  A stage with a target date reads "Expected by 15 Sept" — the developer sets
 *  it in the dev workspace, and this is where it becomes a promise the client
 *  can hold the agency to.
 *
 *  What this deliberately does NOT do is paint a passed date red. The dev
 *  workspace does exactly that, because a developer needs to see what has
 *  slipped; doing it here would mean the agency flagging its own lateness, in
 *  the reserved critical colour, on the client's screen, on every page load,
 *  before anyone from the agency has had the chance to explain. The date is
 *  still there and a client can read a calendar — so nothing is hidden — but
 *  the conversation about a slip belongs in the updates feed, written by a
 *  person.
 *
 *  If the agency would rather not promise dates at all, one flag turns the
 *  whole thing off: `features.stepTargetDates` in config/portal.ts.
 * ============================================================================
 */

const TONE: Record<MilestoneStatus, StatusTone> = {
  done: "good",
  in_progress: "warning",
  pending: "neutral",
};

/** The marker on the spine for each state. */
const MARKER: Record<MilestoneStatus, string> = {
  done: "border-status-good bg-status-good",
  in_progress: "border-status-warning bg-deck-surface",
  pending: "border-hairline-strong bg-deck-surface",
};

export function MilestoneTrack({ milestones }: { milestones: Milestone[] }) {
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title={content.milestones.title}
        hint={content.milestones.hint}
      />

      <PanelBody className="flex flex-1 flex-col">
        {milestones.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={content.milestones.emptyTitle}
            description={content.milestones.emptyDescription}
          />
        ) : (
          <ol className="flex flex-col">
            {milestones.map((milestone, index) => {
              const last = index === milestones.length - 1;
              // The connector belongs to the step ABOVE it, so it is lit only
              // when that step is finished — the spine fills in behind the
              // client rather than ahead of them.
              const connectorLit = milestone.status === "done";

              return (
                <li key={milestone.id} className="flex gap-3.5">
                  {/* -------- The spine -------- */}
                  <div
                    aria-hidden
                    className="flex w-3 shrink-0 flex-col items-center"
                  >
                    <span
                      className={cn(
                        "mt-1 size-3 shrink-0 rounded-full border-2",
                        MARKER[milestone.status],
                      )}
                    />
                    {!last && (
                      <span
                        className={cn(
                          "w-px flex-1",
                          connectorLit ? "bg-status-good/35" : "bg-hairline",
                        )}
                      />
                    )}
                  </div>

                  {/* -------- The step -------- */}
                  {/* The marker is decorative — the pill beside it carries the
                      state in an icon AND a word, so this survives greyscale,
                      colour blindness and the print stylesheet. See THE NEVER
                      COLOUR ALONE RULE in DESIGN.md. */}
                  <div
                    className={cn(
                      "flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1.5",
                      last ? "pb-0" : "pb-5",
                    )}
                  >
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate text-[0.875rem]",
                          milestone.status === "pending"
                            ? "text-ink-muted"
                            : "text-ink-soft",
                        )}
                      >
                        {milestone.label}
                      </span>

                      {/* Only on stages still to come. A date under a finished
                          stage invites the reader to check whether it was hit,
                          which is a different — and much less friendly —
                          feature than the one this is. */}
                      {features.stepTargetDates &&
                        milestone.status !== "done" &&
                        milestone.targetDate && (
                          <span className="deck-nums mt-0.5 block font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
                            {template(content.milestones.expectedBy, {
                              date: formatShortDate(milestone.targetDate),
                            })}
                          </span>
                        )}
                    </span>

                    <StatusPill
                      tone={TONE[milestone.status]}
                      label={content.milestones.status[milestone.status]}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </PanelBody>
    </Panel>
  );
}
