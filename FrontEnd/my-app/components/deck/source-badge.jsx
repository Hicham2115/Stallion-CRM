import { cn } from "@/lib/utils";
// Deliberately neutral grey for every source — eight hues can't be told
// apart at pill size and a lead source doesn't have a good/bad reading the
// way the reserved status palette implies.
const UNKNOWN_SOURCE = "Not recorded";
export function SourceBadge({ source, className, }) {
    const known = source.trim().length > 0;
    return (<span className={cn("inline-flex items-center whitespace-nowrap rounded-md border border-hairline bg-white/[0.04] px-2.5 py-0.5 text-[0.75rem]", known ? "text-ink-soft" : "italic text-ink-muted", className)}>
      {known ? source : UNKNOWN_SOURCE}
    </span>);
}
