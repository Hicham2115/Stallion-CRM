"use client";
import { BarChart3 } from "lucide-react";
import { DataCell, DataRow, DataTable } from "@/components/deck/data-table";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { analysisConfig } from "@/config/analysis";
import { formatCurrency, formatNumber } from "@/lib/format";
const { content } = analysisConfig;
/**
 * The campaign and creative breakdowns from /api/analytics/kpis. One
 * component for both: they are the same table with a different identity
 * column, and two copies would drift the moment one of them gained a column.
 *
 * WHY SO MANY CELLS ARE EMPTY. `spend` and `cpl` come from a separate table
 * (`ad_spend`) that is joined to a lead by EXACT NAME MATCH, not by an id —
 * there is no Meta API integration. A campaign whose imported spend row is
 * spelled differently gets no spend, and KpiService returns null rather than
 * inventing a zero. `note` on this panel says so on screen, because "why is
 * Spend blank" is otherwise a support question every single time.
 */
export function PerformanceTable({ title, hint, caption, columns, rows, emptyTitle, note, rowKey, }) {
    return (<Panel>
      <PanelHeader title={title} hint={hint}/>

      <PanelBody flush>
        {rows.length === 0 ? (<div className="px-5 pb-6 sm:px-6">
            <EmptyState icon={BarChart3} title={emptyTitle}/>
          </div>) : (<>
            <DataTable columns={columns} caption={caption} minWidth="52rem" stickyFirstColumn>
              {rows.map((row) => (<DataRow key={rowKey(row)}>
                  {columns.map((column, index) => (<DataCell key={column.key} numeric={column.numeric} sticky={index === 0} className={column.hideBelow ? HIDE_BELOW[column.hideBelow] : undefined}>
                      {renderCell(row[column.key], column)}
                    </DataCell>))}
                </DataRow>))}
            </DataTable>

            {note && (<p className="px-5 py-4 text-[0.8125rem] leading-relaxed text-ink-muted sm:px-6">
                {note}
              </p>)}
          </>)}
      </PanelBody>
    </Panel>);
}
// Mirrors data-table.jsx's own map — its HIDE_BELOW isn't exported, and the
// body cells here are built from the same column definitions as the headers,
// so they have to hide at the same breakpoint or the columns misalign.
const HIDE_BELOW = {
    sm: "hidden sm:table-cell",
    md: "hidden md:table-cell",
    lg: "hidden lg:table-cell",
    xl: "hidden xl:table-cell",
};
/** One cell. A null NEVER becomes 0 — see this file's header. */
function renderCell(value, column) {
    if (value === null || value === undefined || value === "") {
        return (<>
        <span aria-hidden>{content.noData}</span>
        <span className="sr-only">{content.noDataSr}</span>
      </>);
    }
    if (column.format === "currency")
        return formatCurrency(Math.round(value));
    if (column.format === "number")
        return formatNumber(value);
    return value;
}
