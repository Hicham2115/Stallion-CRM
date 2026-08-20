"use client";

import { Sparkline } from "@/components/deck/sparkline";
import { consoleConfig } from "@/config/console";
import { useCrm } from "@/lib/store/crm-store";
import { selectKpis } from "@/lib/store/selectors";
import { cn } from "@/lib/utils";

/**
 * The readout pinned to the bottom of the sidebar.
 *
 * It shows the same "Avg Dials / Rep" figure as the dashboard card, and both
 * read it from `selectKpis()` — so the rail and the dashboard cannot disagree,
 * which they would the moment one of them stored its own copy.
 *
 * Styled as a deck instrument rather than a card: mono label, oversized display
 * numeral, and a trend line behind it. It is one of the three moments carrying
 * the brand into the console.
 */
export function SidebarStat({ className }: { className?: string }) {
  const { state } = useCrm();
  const kpis = selectKpis(state);

  return (
    <div
      className={cn(
        "deck-inset relative overflow-hidden rounded-xl border border-hairline bg-white/[0.02] px-4 pb-3 pt-3.5",
        className,
      )}
    >
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink-muted">
        {consoleConfig.content.sidebarStatLabel}
      </p>

      <p className="deck-nums mt-1 font-display text-[1.75rem] font-semibold leading-none tracking-[-0.03em] text-ink">
        {kpis.avgDialsPerRep}
      </p>

      {/* Sits behind the numeral, bled to the edges, at low opacity — context
          for the figure without becoming a second thing to read. */}
      <Sparkline
        data={state.teamDialsHistory}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 opacity-35"
      />
    </div>
  );
}
