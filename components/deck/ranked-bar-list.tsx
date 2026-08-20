import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * ============================================================================
 *  RANKED BAR LIST
 * ============================================================================
 *  Ranked rows, each with a proportion bar. Shared by the Reports source
 *  breakdown and the Reports dials-per-rep panel.
 *
 *  THE ONE RULE THIS COMPONENT ENFORCES: `share` is a share of the TOTAL, and
 *  the bar width is set to exactly that number.
 *
 *  This exists because the Reports prototype got it wrong in a way that was
 *  invisible until you read the numbers. It scaled every bar against the
 *  LARGEST value, so the top row always filled its track completely regardless
 *  of whether it held 90% of the leads or 13% of them. With a flat source
 *  distribution behind it, all eight bars rendered full width next to the text
 *  "10 (13%)" — a bar claiming everything, beside a number claiming an eighth.
 *
 *  Scaling to the maximum is a legitimate choice for comparing magnitudes, but
 *  then the bar must not sit next to a percentage of the total, because the two
 *  contradict each other. Sharing one denominator is what keeps them honest.
 * ============================================================================
 */

export interface RankedBarRow {
  /** Stable list key. */
  id: string;
  /** The row's name — the thing being ranked. */
  label: string;
  /** The headline figure, already formatted. */
  value: string;
  /** Share of the total, 0-100. Drives the bar width. */
  share: number;
  /**
   * An optional muted figure after the value — the second dimension that stops
   * a panel from restating one it already showed elsewhere.
   */
  secondary?: string;
  /** Tooltip explaining `secondary`, since a bare ratio is ambiguous. */
  secondaryTitle?: string;
}

export function RankedBarList({
  rows,
  /** Bar colour. Any CSS colour; defaults to the brand lime. */
  color = "var(--brand-lime)",
  /** Shows the 1..n rank numeral in front of each label. */
  showRank = true,
  caption,
  className,
}: {
  rows: RankedBarRow[];
  color?: string;
  showRank?: boolean;
  /** Screen-reader description of what the list is ranked by. */
  caption?: ReactNode;
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col gap-3.5", className)}>
      {caption && <li className="sr-only">{caption}</li>}

      {rows.map((row, index) => (
        <li key={row.id}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-baseline gap-2.5">
              {showRank && (
                // Mono and faint so it reads as an index rather than competing
                // with the label beside it. Same treatment as the dashboard
                // leaderboard, so the two panels feel like one system.
                <span className="deck-nums w-3.5 shrink-0 font-mono text-[0.6875rem] text-ink-muted">
                  {index + 1}
                </span>
              )}
              <span className="truncate text-[0.875rem] text-ink-soft">
                {row.label}
              </span>
            </span>

            <span className="flex shrink-0 items-baseline gap-2.5">
              {row.secondary && (
                <span
                  title={row.secondaryTitle}
                  className={cn(
                    "deck-nums font-mono text-[0.625rem] tracking-[0.06em] text-ink-muted",
                    row.secondaryTitle && "cursor-help",
                  )}
                >
                  {row.secondary}
                </span>
              )}
              <span className="deck-nums font-display text-[0.9375rem] font-semibold text-ink">
                {row.value}
              </span>
            </span>
          </div>

          {/* Decorative: the value above is the information, and this restates
              it as a proportion. Hidden from screen readers so the figure is
              not announced twice. */}
          <div
            aria-hidden
            className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]"
          >
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${row.share}%`, backgroundColor: color }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
