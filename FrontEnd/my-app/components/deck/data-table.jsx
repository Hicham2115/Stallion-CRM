var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { cn } from "@/lib/utils";
const HIDE_BELOW = {
    sm: "hidden sm:table-cell",
    md: "hidden md:table-cell",
    lg: "hidden lg:table-cell",
    xl: "hidden xl:table-cell",
};
/** Shared cell padding, so header and body cells can never drift apart. */
export const cellPadding = "px-5 py-3.5 sm:px-6";
/** The column header treatment: mono, uppercase, micro-tracked. */
export const headerCell = "px-5 py-3 text-left font-mono text-[0.625rem] font-normal uppercase tracking-[0.16em] text-ink-muted sm:px-6";
export function DataTable({ columns, caption, minWidth = "48rem",
/** Pins the first column while the rest scrolls under it, so row identity
 *  stays on screen. */
stickyFirstColumn = false, children, className, }) {
    return (<div className={cn("deck-scroll overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left" style={{ minWidth }}>
        <caption className="sr-only">{caption}</caption>

        <thead>
          <tr className="border-y border-hairline">
            {columns.map((column, index) => (<th key={column.key} scope="col" className={cn(headerCell, column.numeric && "text-right", column.width, column.hideBelow && HIDE_BELOW[column.hideBelow], stickyFirstColumn &&
                index === 0 &&
                // Opaque background needed or scrolling columns show through.
                "sticky left-0 z-20 bg-deck-surface")}>
                {column.srOnly ? (<span className="sr-only">{column.label}</span>) : (column.label)}
              </th>))}
          </tr>
        </thead>

        <tbody>{children}</tbody>
      </table>
    </div>);
}
/** A body row. `interactive` adds the hover treatment for rows that link. */
export function DataRow(_a) {
    var { interactive = false, className } = _a, props = __rest(_a, ["interactive", "className"]);
    return (<tr className={cn("border-b border-hairline transition-colors last:border-b-0", interactive && "hover:bg-deck-row", className)} {...props}/>);
}
/** A body cell. */
export function DataCell(_a) {
    var { numeric = false, sticky = false, className } = _a, props = __rest(_a, ["numeric", "sticky", "className"]);
    return (<td className={cn(cellPadding, numeric && "deck-nums text-right",
        // Matches the sticky header cell above.
        sticky && "sticky left-0 z-10 bg-deck-surface", className)} {...props}/>);
}
