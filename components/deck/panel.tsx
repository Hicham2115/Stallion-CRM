import type { ReactNode } from "react";

import { CornerTick } from "@/components/deck/corner-tick";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 *  PANEL — the console's one container
 * ============================================================================
 *  Every block on every admin screen is a Panel. Restyle the whole app's
 *  surfaces by editing this file.
 *
 *  WHY IT SITS *IN* THE SURFACE, NOT ABOVE IT
 *  The login card uses `.deck-lift`: a wide cast shadow that makes it float.
 *  That works for one hero card on an empty page. A dashboard has a dozen
 *  containers, and a dozen floating cards reads as clutter — nothing recedes,
 *  so nothing stands out. `.deck-inset` instead gives a hard 1px ring and an
 *  inner top highlight, so panels read as machined into the deck.
 *
 *  `.deck-lift` stays reserved for things genuinely above the page: menus,
 *  dialogs, and the card you are dragging.
 * ============================================================================
 */

export function Panel({
  className,
  children,
  ticks = false,
  ...props
}: React.ComponentProps<"section"> & {
  /**
   * Registration marks in opposite corners. Use on hero panels only — on every
   * panel they stop being a signature and become wallpaper.
   */
  ticks?: boolean;
}) {
  return (
    <section
      className={cn(
        "deck-inset relative rounded-2xl border border-hairline bg-deck-surface",
        className,
      )}
      {...props}
    >
      {ticks && (
        // Smaller and fainter than the login's marks. At full size on a panel
        // this close to real controls, a crosshair starts reading as a "+"
        // button — which is the last thing a decorative mark should suggest.
        <>
          <CornerTick className="left-3 top-3 size-2.5 opacity-70" />
          <CornerTick className="bottom-3 right-3 size-2.5 opacity-70" />
        </>
      )}
      {children}
    </section>
  );
}

/** Title row. Put actions (filters, toggles) in `actions`. */
export function PanelHeader({
  title,
  hint,
  actions,
  className,
}: {
  title: ReactNode;
  /** Small mono caption under the title — say what the panel measures. */
  hint?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
          {title}
        </h2>
        {hint && (
          <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
            {hint}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Panel body. `flush` removes the padding for edge-to-edge tables. */
export function PanelBody({
  className,
  flush = false,
  ...props
}: React.ComponentProps<"div"> & { flush?: boolean }) {
  return (
    <div
      className={cn(flush ? "mt-5" : "p-5 pt-5 sm:p-6", className)}
      {...props}
    />
  );
}
