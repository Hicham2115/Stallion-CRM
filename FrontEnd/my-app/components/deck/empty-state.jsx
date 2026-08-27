import { cn } from "@/lib/utils";
// A bare header row with no rows looks broken — this says whether there's
// no data, a too-narrow filter, or a failed load, and offers the next action.
export function EmptyState({ icon: Icon, title, description, action, className, }) {
    return (<div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", className)}>
      {Icon && (<span className="grid size-10 place-items-center rounded-xl border border-hairline bg-white/[0.03]">
          <Icon aria-hidden className="size-4 text-ink-muted"/>
        </span>)}
      <div>
        <p className="text-sm font-medium text-ink-soft">{title}</p>
        {description && (<p className="mt-1 max-w-xs text-[0.8125rem] leading-relaxed text-ink-muted">
            {description}
          </p>)}
      </div>
      {action}
    </div>);
}
