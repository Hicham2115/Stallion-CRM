import { Eye } from "lucide-react";
import { Panel } from "@/components/deck/panel";
import { devConfig } from "@/config/dev";
import { template } from "@/lib/format";
const copy = devConfig.content.detail;
// Shows the same progress figure the client sees, so the developer and
// client are looking at one number, plus a visibility note reminding the
// developer every control on this page publishes to someone outside the
// agency.
export function DevProjectHeader({ lead, progress, }) {
    return (<Panel className="px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h2 className="font-display text-[1.5rem] font-semibold tracking-[-0.03em] text-ink">
            {lead.name}
          </h2>
          <p className="mt-0.5 text-[0.9375rem] text-ink-soft">{lead.company}</p>

          {lead.projectSummary && (<p className="mt-1 text-[0.8125rem] text-ink-muted">
              {lead.projectSummary}
            </p>)}
        </div>

        <div className="w-full shrink-0 sm:w-[16rem]">
          <div className="flex items-baseline justify-between gap-3">
            <span className="deck-nums text-[0.8125rem] text-ink-muted">
              {template(copy.progressDetail, {
            done: progress.done,
            total: progress.total,
        })}
            </span>
            <span className="deck-nums font-display text-[0.9375rem] font-semibold text-brand">
              {progress.percent}%
            </span>
          </div>

          <div aria-hidden className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
            <div className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out" style={{ width: `${progress.percent}%` }}/>
          </div>
        </div>
      </div>

      <p className="mt-5 flex items-start gap-2.5 border-t border-hairline pt-4 text-[0.8125rem] leading-relaxed text-ink-muted">
        <Eye aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-faint"/>
        {copy.visibilityNote}
      </p>
    </Panel>);
}
