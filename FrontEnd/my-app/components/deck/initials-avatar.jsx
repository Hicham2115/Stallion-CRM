import { initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";
// Shared stand-in for a person: topbar, conversation header, leaderboard, rep
// roster, kanban cards. Tinted rather than filled — the console's one solid
// lime fill is reserved for the active nav item (see One Lime Answer Rule in
// DESIGN.md). Decorative by default and hidden from assistive tech, since the
// person's name is always shown beside it; pass `label` where it stands alone.
// To add a size, add a step here — never a one-off size-* at the call site.
const SIZES = {
    sm: "size-7", // kanban cards
    md: "size-8", // table rows: leaderboard, rep roster
    lg: "size-9", // conversation header
    xl: "size-10", // topbar account block
};
export function InitialsAvatar({ name, size = "md", label, className, }) {
    return (<span aria-hidden={label ? undefined : true} aria-label={label} role={label ? "img" : undefined} className={cn("grid shrink-0 place-items-center rounded-full bg-brand/15 font-mono text-[0.625rem] font-medium text-brand", SIZES[size], className)}>
      {initialsOf(name)}
    </span>);
}
