"use client";
import { Sparkline } from "@/components/deck/sparkline";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent, template, } from "@/lib/format";
import { useCountUp } from "@/lib/use-count-up";
import { cn } from "@/lib/utils";
// Every card has the same four parts (label, icon, numeral, a filled foot)
// so the row reads as one instrument rather than four unrelated boxes.
// Which foot a card gets is declared in config/admin.ts (`foot`).
export function KpiCard({ definition, value, captionValue, sparkline, delta, revealDelay = 0, }) {
    const Icon = definition.icon;
    const animated = useCountUp(value);
    const display = definition.format === "percent"
        ? formatPercent(animated)
        : definition.format === "currency"
            ? formatCompactCurrency(animated)
            : formatNumber(Math.round(animated));
    // Exact figure sits behind a hover on the compact currency display.
    const exact = definition.format === "currency" ? formatCurrency(Math.round(value)) : undefined;
    // Clamped so a KPI beating its target fills the bar, not overflows it.
    const progress = definition.target && definition.target > 0
        ? Math.min((value / definition.target) * 100, 100)
        : 0;
    return (<div className="reveal deck-inset relative flex flex-col overflow-hidden rounded-2xl border border-hairline bg-deck-surface p-5" style={{ "--reveal-delay": `${revealDelay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
            {definition.label}
          </p>

          {delta && (<span title={delta.title} className={cn("deck-nums mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[0.625rem] tracking-[0.06em]", delta.title && "cursor-help",
            // Direction is also carried by the sign in the label text, so
            // the chip reads in greyscale too.
            delta.direction === "up" &&
                "border-[rgb(154_230_92/0.28)] bg-[rgb(154_230_92/0.1)] text-[var(--status-good)]", delta.direction === "down" &&
                "border-[rgb(248_113_113/0.28)] bg-[rgb(248_113_113/0.1)] text-[var(--status-critical)]", delta.direction === "flat" &&
                "border-hairline bg-white/[0.04] text-ink-muted")}>
              {delta.label}
            </span>)}
        </div>
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-ink-muted">
          <Icon className="size-4"/>
        </span>
      </div>

      <p title={exact} className={cn("deck-nums mt-4 font-display text-[2.5rem] font-semibold leading-none tracking-[-0.04em] text-ink", exact && "cursor-help")}>
        {display}
      </p>

      <div className="mt-auto pt-4">
        {definition.foot === "caption" && definition.caption && (<p className="text-[0.8125rem] text-ink-muted">
            {template(definition.caption, { n: formatNumber(captionValue ?? 0) })}
          </p>)}

        {definition.foot === "progress" && (<div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]"
        // Duplicates the number above it, so decorative for screen readers.
        aria-hidden>
            <div className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }}/>
          </div>)}

        {definition.foot === "sparkline" && sparkline && (<Sparkline data={sparkline} className="h-8"/>)}
      </div>
    </div>);
}
// Matches the card's real height so the layout doesn't jump when data lands.
export function KpiCardSkeleton({ className }) {
    return (<div className={cn("deck-inset h-[10.5rem] animate-pulse rounded-2xl border border-hairline bg-deck-surface", className)}/>);
}
