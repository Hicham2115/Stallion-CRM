import { cn } from "@/lib/utils";
// Hairline with measurement marks, shared between the login footer and the
// dashboard KPI cluster. Gradient lives in .deck-ruler (app/globals.css).
export function TickRuler({ className, fade, }) {
    return (<div aria-hidden className={cn("deck-ruler h-2.5 w-full border-t border-hairline opacity-40", className)} style={fade ? { "--deck-ruler-fade": fade } : undefined}/>);
}
