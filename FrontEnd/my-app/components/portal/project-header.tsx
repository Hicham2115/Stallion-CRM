import { Panel } from "@/components/deck/panel";
import { StatusPill, type StatusTone } from "@/components/deck/status-pill";
import { portalConfig } from "@/config/portal";
import { template } from "@/lib/format";
import type { ProjectProgress } from "@/lib/store/selectors";
import type { Lead } from "@/lib/types";

const { content } = portalConfig;

/**
 * ============================================================================
 *  PROJECT HEADER — the one thing a client opens the portal to see
 * ============================================================================
 *  Name, what we are building, and how far along it is. Everything else on the
 *  portal is detail behind this panel.
 *
 *  WHAT CHANGED FROM THE PROTOTYPE. It printed a hard-coded "100%" above a
 *  progress rail — a number that is correct exactly once and silently wrong
 *  from then on. The figure now comes from `selectProjectProgress()`, counting
 *  the client's own completed stages, so the percentage and the stage list
 *  further down the page cannot disagree.
 *
 *  Two additions beyond the original: the ONE-LINE SUMMARY of what we are
 *  building (a client with two projects at the agency could not otherwise tell
 *  which one they were looking at), and a STATE PILL, because "60%" alone does
 *  not distinguish a project moving nicely from one that stalled.
 * ============================================================================
 */

/** The project's state, as a pill. Icon + label, never colour alone. */
function stateOf(progress: ProjectProgress): {
  tone: StatusTone;
  label: string;
} {
  if (progress.launched) {
    return { tone: "good", label: content.links.liveBadge };
  }
  if (progress.current) {
    return {
      tone: "warning",
      label: content.milestones.status.in_progress,
    };
  }
  return { tone: "neutral", label: content.status.startingTitle };
}

export function ProjectHeader({
  lead,
  progress,
}: {
  lead: Lead;
  progress: ProjectProgress;
}) {
  const state = stateOf(progress);

  return (
    <Panel ticks className="px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="font-display text-[1.5rem] font-semibold tracking-[-0.03em] text-ink sm:text-[1.75rem]">
            {template(content.header.titleTemplate, { name: lead.name })}
          </h2>

          {/* Company, then the one-line summary. The company is the identity;
              the summary is the answer to "which project is this". */}
          <p className="mt-1 text-[0.9375rem] text-ink-soft">{lead.company}</p>
          <p className="mt-0.5 text-[0.8125rem] text-ink-muted">
            {lead.projectSummary || content.header.summaryFallback}
          </p>
        </div>

        <StatusPill tone={state.tone} label={state.label} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Progress                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[0.875rem] font-medium text-ink">
            {content.header.progressLabel}
          </span>

          {/* deck-nums so the figure keeps its width as it changes — without
              tabular figures a rail animating 68% -> 71% jitters. */}
          <span className="deck-nums font-display text-[0.9375rem] font-semibold text-brand">
            {progress.percent}%
          </span>
        </div>

        {/* A real progressbar rather than a decorative div: this is the
            headline measurement of the whole screen, so a screen reader should
            get the value, not just the "68%" text beside it. `aria-valuetext`
            says the same thing the caption underneath says, in words. */}
        <div
          role="progressbar"
          aria-label={content.header.progressAccessibleLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
          aria-valuetext={template(content.header.progressDetail, {
            done: progress.done,
            total: progress.total,
          })}
          className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.07]"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        {/* The count under the bar. A percentage alone hides how many steps
            there are, and "3 of 4" is what a client repeats back on a call. */}
        {progress.total > 0 && (
          <p className="deck-nums mt-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
            {template(content.header.progressDetail, {
              done: progress.done,
              total: progress.total,
            })}
          </p>
        )}
      </div>
    </Panel>
  );
}
