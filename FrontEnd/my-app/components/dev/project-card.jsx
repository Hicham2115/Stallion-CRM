import Link from "next/link";
import { CircleAlert, Globe, ImageIcon } from "lucide-react";
import { devConfig } from "@/config/dev";
import { template } from "@/lib/format";
import { cn } from "@/lib/utils";
const { content, routes } = devConfig;
// The whole card is the link (an anchor wrapping the surface gets pointer,
// focus ring, middle-click and status-bar preview for free). Meta row below
// answers "which project needs me today" via three chips the percentage
// alone can't: late, previewed, live.
export function ProjectCard({ row }) {
    const { lead, progress, previewCount, live, overdue } = row;
    return (<Link href={routes.project(lead.id)} className={cn("deck-inset group relative flex w-full flex-col rounded-2xl border border-hairline bg-deck-surface p-5 transition-colors", "hover:border-hairline-strong hover:bg-white/[0.035]", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deck-void")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
            {lead.name}
          </p>
          <p className="mt-0.5 truncate text-[0.875rem] text-ink-muted">
            {lead.company}
          </p>
        </div>

        {overdue > 0 && (<span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-status-critical/30 bg-status-critical/10 px-2.5 py-0.5 text-[0.75rem] font-medium text-status-critical">
            <CircleAlert aria-hidden className="size-3"/>
            {template(content.list.overdueChip, { n: overdue })}
          </span>)}
      </div>

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

        <div aria-hidden className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out" style={{ width: `${progress.percent}%` }}/>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-hairline pt-3.5">
        <span className={cn("inline-flex items-center gap-1.5 text-[0.75rem]", previewCount > 0 ? "text-ink-soft" : "text-ink-muted")}>
          <ImageIcon aria-hidden className="size-3.5 shrink-0"/>
          {previewCount > 0
            ? template(content.list.previewCount, { n: previewCount })
            : content.list.previewNone}
        </span>

        {live && (<span className="inline-flex items-center gap-1.5 text-[0.75rem] text-status-good">
            <Globe aria-hidden className="size-3.5 shrink-0"/>
            {content.list.liveChip}
          </span>)}
      </div>
    </Link>);
}
