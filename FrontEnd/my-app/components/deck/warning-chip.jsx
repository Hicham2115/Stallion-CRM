import { cn } from "@/lib/utils";
// A standing caution marker (mock-data chip, preview-build notice), not a
// transient error — always on screen rather than appearing once you push on
// it. Use the form alert for actual errors.
export function WarningChip({ icon: Icon, label, title, className, }) {
    return (<span title={title} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.18em]", "border-status-warning/28 bg-status-warning/10 text-status-warning", className)}>
      {Icon && <Icon aria-hidden className="size-3"/>}
      {label}
    </span>);
}
