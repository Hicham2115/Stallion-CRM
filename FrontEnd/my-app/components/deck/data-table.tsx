import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * ============================================================================
 *  DATA TABLE — the hairline table shell
 * ============================================================================
 *  The shared chrome behind the Clients table, the Settings rep list and both
 *  Reports lists. Not a data grid: no sorting, no pagination, no column model.
 *  It owns the SHELL — scroll container, hairlines, header typography, sticky
 *  first column — and each screen supplies its own rows.
 *
 *  That split is deliberate. A generic table component that also owns cell
 *  rendering ends up with a `renderCell` prop per screen and is harder to read
 *  than the four plain tables it replaced. What actually repeats here is the
 *  chrome, so the chrome is all that is shared.
 *
 *  RESPONSIVE CONTRACT: the table scrolls horizontally inside its own
 *  container and never widens the page. Screens with more than about four
 *  columns should render a card list below `md` instead — see
 *  components/admin/clients/client-card.tsx.
 * ============================================================================
 */

export interface DataColumn {
  key: string;
  label: string;
  /** Right-aligns the column. Use for figures. */
  numeric?: boolean;
  /** Hides the header text visually but keeps it for screen readers — for
   *  action columns, which need a name but not a visible heading. */
  srOnly?: boolean;
  /** Tailwind width utility, e.g. "w-[14rem]". */
  width?: string;
  /** Hides the column below the given breakpoint, e.g. "lg". */
  hideBelow?: "sm" | "md" | "lg" | "xl";
}

const HIDE_BELOW: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

/** Shared cell padding, so header and body cells can never drift apart. */
export const cellPadding = "px-5 py-3.5 sm:px-6";

/** The column header treatment: mono, uppercase, micro-tracked. */
export const headerCell =
  "px-5 py-3 text-left font-mono text-[0.625rem] font-normal uppercase tracking-[0.16em] text-ink-muted sm:px-6";

export function DataTable({
  columns,
  caption,
  minWidth = "48rem",
  /**
   * Pins the first column while the rest scrolls under it. On a wide table the
   * row identity is the one thing that must stay on screen — scrolling to the
   * invoice column and losing track of whose invoice it is makes the table
   * useless on a laptop.
   */
  stickyFirstColumn = false,
  children,
  className,
}: {
  columns: DataColumn[];
  /** Screen-reader description of the table. Required — a bare grid of cells
   *  with no caption gives assistive tech nothing to announce. */
  caption: ReactNode;
  minWidth?: string;
  stickyFirstColumn?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("deck-scroll overflow-x-auto", className)}>
      <table
        className="w-full border-collapse text-left"
        style={{ minWidth }}
      >
        <caption className="sr-only">{caption}</caption>

        <thead>
          <tr className="border-y border-hairline">
            {columns.map((column, index) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  headerCell,
                  column.numeric && "text-right",
                  column.width,
                  column.hideBelow && HIDE_BELOW[column.hideBelow],
                  stickyFirstColumn &&
                    index === 0 &&
                    // The header cell needs its own opaque background, or the
                    // scrolling columns show through it as it passes under.
                    "sticky left-0 z-20 bg-deck-surface",
                )}
              >
                {column.srOnly ? (
                  <span className="sr-only">{column.label}</span>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** A body row. `interactive` adds the hover treatment for rows that link. */
export function DataRow({
  interactive = false,
  className,
  ...props
}: React.ComponentProps<"tr"> & { interactive?: boolean }) {
  return (
    <tr
      className={cn(
        "border-b border-hairline transition-colors last:border-b-0",
        interactive && "hover:bg-deck-row",
        className,
      )}
      {...props}
    />
  );
}

/** A body cell. */
export function DataCell({
  numeric = false,
  sticky = false,
  className,
  ...props
}: React.ComponentProps<"td"> & { numeric?: boolean; sticky?: boolean }) {
  return (
    <td
      className={cn(
        cellPadding,
        numeric && "deck-nums text-right",
        // Matches the sticky header cell above. `bg-deck-surface` rather than
        // transparent for the same reason: scrolled columns must not show
        // through. The row hover tint is layered over it by the parent.
        sticky && "sticky left-0 z-10 bg-deck-surface",
        className,
      )}
      {...props}
    />
  );
}
