import { cn } from "@/lib/utils";
export function RankedBarList({ rows, 
/** Bar colour. Any CSS colour; defaults to the brand lime. */
color = "var(--brand-lime)", 
/** Shows the 1..n rank numeral in front of each label. */
showRank = true, caption, className, }) {
    return (<ol className={cn("flex flex-col gap-3.5", className)}>
      {caption && <li className="sr-only">{caption}</li>}

      {rows.map((row, index) => (<li key={row.id}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-baseline gap-2.5">
              {showRank && (
            <span className="deck-nums w-3.5 shrink-0 font-mono text-[0.6875rem] text-ink-muted">
                  {index + 1}
                </span>)}
              <span className="truncate text-[0.875rem] text-ink-soft">
                {row.label}
              </span>
            </span>

            <span className="flex shrink-0 items-baseline gap-2.5">
              {row.secondary && (<span title={row.secondaryTitle} className={cn("deck-nums font-mono text-[0.625rem] tracking-[0.06em] text-ink-muted", row.secondaryTitle && "cursor-help")}>
                  {row.secondary}
                </span>)}
              <span className="deck-nums font-display text-[0.9375rem] font-semibold text-ink">
                {row.value}
              </span>
            </span>
          </div>

          <div aria-hidden className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${row.share}%`, backgroundColor: color }}/>
          </div>
        </li>))}
    </ol>);
}
