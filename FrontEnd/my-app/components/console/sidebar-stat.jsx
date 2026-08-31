"use client";
import { Sparkline } from "@/components/deck/sparkline";
import { useSession } from "@/components/console/session-provider";
import { consoleConfig } from "@/config/console";
import { roleDefinitions } from "@/config/roles";
import { useCrm } from "@/lib/store/crm-store";
import { selectKpis, selectRepKpis } from "@/lib/store/selectors";
import { cn } from "@/lib/utils";
// Same "Avg Dials / Rep" figure as the dashboard card, read from the same
// selectKpis() so the two can't disagree. A rep sees their own dials today
// instead of the team average, since they can't act on a team figure.
export function SidebarStat({ className }) {
    const { state } = useCrm();
    const session = useSession();
    const kind = roleDefinitions[session.role].sidebarStat;
    const own = kind === "own";
    const value = own
        ? selectRepKpis(state, session.repId).dialsToday
        : selectKpis(state).avgDialsPerRep;
    return (<div className={cn("deck-inset relative overflow-hidden rounded-md border border-hairline bg-white/[0.02] px-4 pb-3 pt-3.5", className)}>
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink-muted">
        {own
            ? consoleConfig.content.repStatLabel
            : consoleConfig.content.sidebarStatLabel}
      </p>

      <p className="deck-nums mt-1 font-display text-[1.75rem] font-semibold leading-none tracking-[-0.03em] text-ink">
        {value}
      </p>

      <Sparkline data={state.teamDialsHistory} className="pointer-events-none absolute inset-x-0 bottom-0 h-8 opacity-35"/>
    </div>);
}
