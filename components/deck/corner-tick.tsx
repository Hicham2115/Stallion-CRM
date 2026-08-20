import { cn } from "@/lib/utils";

/**
 * A crosshair registration mark, like the corner ticks on a print plate.
 *
 * Purely decorative — it is what gives a surface its "instrument housing" feel.
 * Extracted from the login brand panel so the console panels use the same mark
 * rather than a second, slightly-different copy of it.
 *
 * Position it with the `className`, e.g. `className="left-5 top-5"`. The host
 * element must be `position: relative`.
 */
export function CornerTick({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      // cn() rather than a template string so a caller can override the size —
      // console panels use a smaller mark than the login's big brand panel.
      className={cn(
        "pointer-events-none absolute size-3.5 text-ink-faint",
        className,
      )}
    >
      <path
        d="M10 0v20M0 10h20"
        stroke="currentColor"
        strokeWidth="1"
        // Keeps the stroke exactly 1px however the SVG is scaled — without it,
        // a hairline drawn in a scaled viewBox goes blurry.
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
