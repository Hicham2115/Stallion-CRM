import { cn } from "@/lib/utils";
// Always decoration — a dot alone can't carry meaning to a colourblind or
// screen-reader user, so every caller pairs it with a visible text label.
export function StatusDot({ color, pulse = false, className, }) {
    return (<span aria-hidden className={cn("inline-block size-1.5 shrink-0 rounded-full", pulse && "deck-dot", className)} style={{ backgroundColor: color ?? "var(--brand-lime)" }}/>);
}
