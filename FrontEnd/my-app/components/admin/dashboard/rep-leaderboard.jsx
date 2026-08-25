"use client";
import { useState } from "react";
import { ArrowDown, Users } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { adminConfig } from "@/config/admin";
import { formatNumber, template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { selectLeaderboard } from "@/lib/store/selectors";
import { cn } from "@/lib/utils";
const { content, leaderboardColumns, leaderboardLimit } = adminConfig.dashboard;
// Ranked by the active metric, sort default rather than creation order. A
// recessive bar sits behind the active metric's figure (not beside it, to
// save horizontal space on a laptop) so relative performance is legible.
export function RepLeaderboard() {
    const { state } = useCrm();
    const [metric, setMetric] = useState("dials");
    const rows = selectLeaderboard(state, metric);
    // Looked up once so the hint and screen-reader caption can't drift apart.
    const metricLabel = leaderboardColumns.find((column) => column.key === metric)?.label ?? metric;
    const visible = leaderboardLimit > 0 ? rows.slice(0, leaderboardLimit) : rows;
    return (<Panel>
      <PanelHeader title={content.leaderboardTitle} hint={template(content.leaderboardRankedBy, { metric: metricLabel.toLowerCase() })}/>

      <PanelBody flush>
        {visible.length === 0 ? (<EmptyState icon={Users} title={content.emptyLeaderboard}/>) : (<div className="deck-scroll overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left">
              <caption className="sr-only">
                {template(content.leaderboardCaption, { metric: metricLabel })}
              </caption>

              <thead>
                <tr className="border-y border-hairline">
                  <th scope="col" className="px-5 py-3 font-mono text-[0.625rem] font-normal uppercase tracking-[0.16em] text-ink-muted sm:px-6">
                    {content.repColumnLabel}
                  </th>

                  {leaderboardColumns.map((column) => {
                const active = column.key === metric;
                return (<th key={column.key} scope="col" aria-sort={active ? "descending" : "none"} className="px-5 py-3 font-mono text-[0.625rem] font-normal uppercase tracking-[0.16em] sm:px-6">
                        <button type="button" onClick={() => setMetric(column.key)} className={cn("inline-flex items-center gap-1.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60", active
                        ? "text-brand"
                        : "text-ink-muted hover:text-ink-soft")}>
                          {column.label}
                          <ArrowDown aria-hidden className={cn("size-3 transition-opacity", active ? "opacity-100" : "opacity-0")}/>
                          <span className="sr-only">
                            {active ? " (sorted)" : " — sort by this column"}
                          </span>
                        </button>
                      </th>);
            })}
                </tr>
              </thead>

              <tbody>
                {visible.map((rep) => (<tr key={rep.id} className="border-b border-hairline transition-colors last:border-b-0 hover:bg-deck-row">
                    <th scope="row" className="px-5 py-3.5 text-left font-normal sm:px-6">
                      <span className="flex items-center gap-3">
                        <span className="deck-nums w-4 shrink-0 font-mono text-[0.6875rem] text-ink-muted">
                          {rep.rank}
                        </span>
                        <InitialsAvatar name={rep.name}/>
                        <span className="truncate text-[0.875rem] font-medium text-ink">
                          {rep.name}
                        </span>
                      </span>
                    </th>

                    {leaderboardColumns.map((column) => {
                    const active = column.key === metric;
                    return (<td key={column.key} className="relative px-5 py-3.5 sm:px-6">
                          <span className={cn("deck-nums relative text-[0.875rem]", active ? "font-semibold text-ink" : "text-ink-soft")}>
                            {formatNumber(rep[column.key])}
                          </span>

                          {/* Thin rule under the figure, not a full-height
                              tint — that would read as a selected cell rather
                              than a measurement. */}
                          {active && (<span aria-hidden className="absolute inset-x-5 bottom-2 h-[3px] overflow-hidden rounded-full bg-white/[0.05] sm:inset-x-6">
                              <span className="block h-full rounded-full bg-brand/50 transition-[width] duration-700 ease-out" style={{ width: `${rep.relative}%` }}/>
                            </span>)}
                        </td>);
                })}
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </PanelBody>
    </Panel>);
}
