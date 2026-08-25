import { cn } from "@/lib/utils";
// Purely decorative crosshair registration mark. Position with className,
// e.g. "left-5 top-5"; the host element must be position: relative.
export function CornerTick({ className }) {
    return (<svg viewBox="0 0 20 20" aria-hidden className={cn("pointer-events-none absolute size-3.5 text-ink-faint", className)}>
      <path d="M10 0v20M0 10h20" stroke="currentColor" strokeWidth="1"
    // Keeps the stroke exactly 1px regardless of SVG scaling.
    vectorEffect="non-scaling-stroke"/>
    </svg>);
}
