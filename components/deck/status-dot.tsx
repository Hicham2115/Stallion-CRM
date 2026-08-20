import { cn } from "@/lib/utils";

/**
 * A small round marker, optionally pulsing.
 *
 * Two jobs across the app:
 *  - live/status indicator (pulsing), as in the login footer
 *  - a stage colour swatch next to a label, as in the kanban headers and the
 *    Client Status list
 *
 * IMPORTANT: this is always decoration. A dot alone cannot carry meaning — it
 * is invisible to a colourblind reader and to anyone using a screen reader —
 * so every caller pairs it with a visible text label and the dot stays
 * aria-hidden.
 */
export function StatusDot({
  color,
  pulse = false,
  className,
}: {
  /** Any CSS colour. Defaults to the brand lime. Stage colours come from
   *  `stageColor()` in config/pipeline.ts. */
  color?: string;
  /** Adds the breathing halo. Reserve it for "this is live", not decoration —
   *  several pulsing dots on one screen is just noise. */
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        pulse && "deck-dot",
        className,
      )}
      style={{ backgroundColor: color ?? "var(--brand-lime)" }}
    />
  );
}
