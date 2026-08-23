"use client";

import { Sparkline } from "@/components/deck/sparkline";
import { useSession } from "@/components/console/session-provider";
import { consoleConfig } from "@/config/console";
import { roleDefinitions } from "@/config/roles";
import { useCrm } from "@/lib/store/crm-store";
import { selectKpis, selectRepKpis } from "@/lib/store/selectors";
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
 *
 * IT SAYS SOMETHING DIFFERENT TO A REP. An admin gets the team average; a rep
 * gets their OWN dials today, because a rep cannot act on a team average and
 * would spend the first week wondering why "their" number never matched what
 * they did. Same instrument, same position, first-person figure — and both
 * come from the selectors, so neither can drift from the dashboard card it
 * mirrors.
 */
export function SidebarStat({ className }: { className?: string }) {
  const { state } = useCrm();
  const session = useSession();

  // Which readout this role gets is declared once, in config/roles.ts, beside
  // that role's permissions — not re-derived from the role name here.
  const kind = roleDefinitions[session.role].sidebarStat;
  const own = kind === "own";

  const value = own
    ? selectRepKpis(state, session.repId).dialsToday
    : selectKpis(state).avgDialsPerRep;

  return (
    <div
      className={cn(
        "deck-inset relative overflow-hidden rounded-xl border border-hairline bg-white/[0.02] px-4 pb-3 pt-3.5",
        className,
      )}
    >
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink-muted">
        {own
          ? consoleConfig.content.repStatLabel
          : consoleConfig.content.sidebarStatLabel}
      </p>

      <p className="deck-nums mt-1 font-display text-[1.75rem] font-semibold leading-none tracking-[-0.03em] text-ink">
        {value}
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
