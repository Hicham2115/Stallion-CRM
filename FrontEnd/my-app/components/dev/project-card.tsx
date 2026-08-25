import Link from "next/link";
import { CircleAlert, Globe, ImageIcon } from "lucide-react";

import { devConfig } from "@/config/dev";
import { template } from "@/lib/format";
import type { ProjectRow } from "@/lib/store/selectors";
import { cn } from "@/lib/utils";

const { content, routes } = devConfig;

/**
 * ============================================================================
 *  PROJECT CARD
 * ============================================================================
 *  One client project on the dev workspace grid.
 *
 *  THE WHOLE CARD IS THE LINK. In the prototype the card was a passive tile
 *  with no visible affordance — nothing said it opened anything, so the only
 *  way to find out was to click and see. An anchor wrapping the whole surface
 *  gives the pointer, the focus ring, middle-click-to-open and the status-bar
 *  URL preview for free, all of which a nested "Open" button would have to
 *  reimplement badly.
 *
 *  THE META ROW IS THE ADDITION. The prototype showed steps and a percentage,
 *  which answers "how far along" and nothing else. A developer scanning
 *  fourteen projects is really asking "which one needs me today", and that is
 *  answered by three things the percentage cannot say: is anything LATE, has
 *  the client been shown anything yet, and is it LIVE. Each is one chip.
 * ============================================================================
 */
export function ProjectCard({ row }: { row: ProjectRow }) {
  const { lead, progress, previewCount, live, overdue } = row;

  return (
    <Link
      href={routes.project(lead.id)}
      className={cn(
        "deck-inset group relative flex w-full flex-col rounded-2xl border border-hairline bg-deck-surface p-5 transition-colors",
        "hover:border-hairline-strong hover:bg-white/[0.035]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deck-void",
      )}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Identity                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
            {lead.name}
          </p>
          <p className="mt-0.5 truncate text-[0.875rem] text-ink-muted">
            {lead.company}
          </p>
        </div>

        {/* The one thing worth interrupting a scan for. Overdue outranks
            "live", because live is a finished state and late is a request. */}
        {overdue > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-status-critical/30 bg-status-critical/10 px-2.5 py-0.5 text-[0.75rem] font-medium text-status-critical">
            <CircleAlert aria-hidden className="size-3" />
            {template(content.list.overdueChip, { n: overdue })}
          </span>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Progress                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="deck-nums text-[0.875rem] text-ink-soft">
            {template(content.list.stepCount, {
              done: progress.done,
              total: progress.total,
            })}
          </span>
          <span className="deck-nums text-[0.875rem] font-semibold text-brand">
            {progress.percent}%
          </span>
        </div>

        {/* Decorative: the two figures directly above say the same thing in
            words, and announcing it a third time helps nobody. */}
        <div
          aria-hidden
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* What the client can currently see                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-hairline pt-3.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[0.75rem]",
            previewCount > 0 ? "text-ink-soft" : "text-ink-muted",
          )}
        >
          <ImageIcon aria-hidden className="size-3.5 shrink-0" />
          {previewCount > 0
            ? template(content.list.previewCount, { n: previewCount })
            : content.list.previewNone}
        </span>

        {live && (
          <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-status-good">
            <Globe aria-hidden className="size-3.5 shrink-0" />
            {content.list.liveChip}
          </span>
        )}
      </div>
    </Link>
  );
}
