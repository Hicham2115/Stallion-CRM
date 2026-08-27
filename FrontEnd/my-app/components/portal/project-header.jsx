import { Panel } from "@/components/deck/panel";
import { StatusPill } from "@/components/deck/status-pill";
import { portalConfig } from "@/config/portal";
import { template } from "@/lib/format";
const { content } = portalConfig;
// Progress figure comes from selectProjectProgress() rather than a hardcoded
// number, so the percentage and the stage list further down can't disagree.
function stateOf(progress) {
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
export function ProjectHeader({ lead, progress, }) {
    const state = stateOf(progress);
    return (<Panel ticks className="px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="font-display text-[1.5rem] font-semibold tracking-[-0.03em] text-ink sm:text-[1.75rem]">
            {template(content.header.titleTemplate, { name: lead.name })}
          </h2>

          <p className="mt-1 text-[0.9375rem] text-ink-soft">{lead.company}</p>
          <p className="mt-0.5 text-[0.8125rem] text-ink-muted">
            {lead.projectSummary || content.header.summaryFallback}
          </p>
        </div>

        <StatusPill tone={state.tone} label={state.label}/>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[0.875rem] font-medium text-ink">
            {content.header.progressLabel}
          </span>

          <span className="deck-nums font-display text-[0.9375rem] font-semibold text-brand">
            {progress.percent}%
          </span>
        </div>

        {/* Real progressbar, not a decorative div, so a screen reader gets
            the value; aria-valuetext mirrors the caption below in words. */}
        <div role="progressbar" aria-label={content.header.progressAccessibleLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent} aria-valuetext={template(content.header.progressDetail, {
            done: progress.done,
            total: progress.total,
        })} className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out" style={{ width: `${progress.percent}%` }}/>
        </div>

        {progress.total > 0 && (<p className="deck-nums mt-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
            {template(content.header.progressDetail, {
                done: progress.done,
                total: progress.total,
            })}
          </p>)}
      </div>
    </Panel>);
}
