"use client";

import type { CSSProperties } from "react";

import { Sparkline } from "@/components/deck/sparkline";
import type { KpiDefinition } from "@/config/admin";
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
  template,
} from "@/lib/format";
import { useCountUp } from "@/lib/use-count-up";
import { cn } from "@/lib/utils";

/**
 * One gauge in the instrument cluster.
 *
 * ANATOMY — every card has all four parts, always:
 *    mono label · icon · display numeral · a filled foot
 *
 * The prototype gave two cards a progress bar, one a caption and one nothing at
 * all, which left a visible hole in the row and made four cards that should
 * read as a single instrument look like four unrelated boxes. Which foot a card
 * gets is declared in `config/admin.ts` (`foot`), so the row can be rebalanced
 * without touching this file.
 */
export function KpiCard({
  definition,
  value,
  captionValue,
  sparkline,
  delta,
  revealDelay = 0,
}: {
  definition: KpiDefinition<string>;
  /** The figure itself. Percentages arrive as whole numbers (65, not 0.65). */
  value: number;
  /** Fills the `{n}` token in a caption foot, e.g. total leads. */
  captionValue?: number;
  /** Series for a sparkline foot. */
  sparkline?: number[];
  /**
   * Period-over-period comparison, shown as a chip beside the label.
   *
   * Reports supplies it; the dashboard does not, because the dashboard has no
   * date range and so nothing to compare against. Omitted rather than shown as
   * "0%", which would assert that nothing changed.
   */
  delta?: { label: string; direction: "up" | "down" | "flat"; title?: string };
  /** Stagger for the page-load choreography, in milliseconds. */
  revealDelay?: number;
}) {
  const Icon = definition.icon;
  const animated = useCountUp(value);

  const display =
    definition.format === "percent"
      ? formatPercent(animated)
      : definition.format === "currency"
        ? formatCompactCurrency(animated)
        : formatNumber(Math.round(animated));

  // The exact figure sits behind a hover on the compact currency display, so
  // the card can use display type without truncating the number.
  const exact =
    definition.format === "currency" ? formatCurrency(Math.round(value)) : undefined;

  // Progress bars clamp: a KPI that beats its target should fill the bar, not
  // overflow the panel.
  const progress =
    definition.target && definition.target > 0
      ? Math.min((value / definition.target) * 100, 100)
      : 0;

  return (
    <div
      className="reveal deck-inset relative flex flex-col overflow-hidden rounded-2xl border border-hairline bg-deck-surface p-5"
      style={{ "--reveal-delay": `${revealDelay}ms` } as CSSProperties}
    >
      {/* Label + icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
            {definition.label}
          </p>

          {delta && (
            <span
              title={delta.title}
              className={cn(
                "deck-nums mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[0.625rem] tracking-[0.06em]",
                delta.title && "cursor-help",
                // Direction is carried by the sign in the label as well as the
                // colour, so the chip still reads in greyscale or to a
                // colourblind user. Flat gets neutral treatment rather than a
                // third hue nobody would learn.
                delta.direction === "up" &&
                  "border-[rgb(154_230_92/0.28)] bg-[rgb(154_230_92/0.1)] text-[var(--status-good)]",
                delta.direction === "down" &&
                  "border-[rgb(248_113_113/0.28)] bg-[rgb(248_113_113/0.1)] text-[var(--status-critical)]",
                delta.direction === "flat" &&
                  "border-hairline bg-white/[0.04] text-ink-muted",
              )}
            >
              {delta.label}
            </span>
          )}
        </div>
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-ink-muted"
        >
          <Icon className="size-4" />
        </span>
      </div>

      {/* The figure. `deck-nums` is what keeps a column of these aligned. */}
      <p
        title={exact}
        className={cn(
          "deck-nums mt-4 font-display text-[2.5rem] font-semibold leading-none tracking-[-0.04em] text-ink",
          exact && "cursor-help",
        )}
      >
        {display}
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* The foot — always filled                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-auto pt-4">
        {definition.foot === "caption" && definition.caption && (
          <p className="text-[0.8125rem] text-ink-muted">
            {template(definition.caption, { n: formatNumber(captionValue ?? 0) })}
          </p>
        )}

        {definition.foot === "progress" && (
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]"
            // The bar duplicates the number above it, so it is decoration for
            // screen readers — announcing "65 percent" twice helps nobody.
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {definition.foot === "sparkline" && sparkline && (
          <Sparkline data={sparkline} className="h-8" />
        )}
      </div>
    </div>
  );
}

/** Loading placeholder, matching the card's real height so the layout does not
 *  jump when the data lands. */
export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "deck-inset h-[10.5rem] animate-pulse rounded-2xl border border-hairline bg-deck-surface",
        className,
      )}
    />
  );
}
