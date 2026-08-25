import { CircleAlert, CircleCheck, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
const TONES = {
    good: {
        icon: CircleCheck,
        color: "var(--status-good)",
        tint: "rgb(154 230 92 / 0.12)",
        border: "rgb(154 230 92 / 0.28)",
    },
    warning: {
        icon: CircleDashed,
        color: "var(--status-warning)",
        tint: "rgb(240 166 58 / 0.12)",
        border: "rgb(240 166 58 / 0.28)",
    },
    critical: {
        icon: CircleAlert,
        color: "var(--status-critical)",
        tint: "rgb(248 113 113 / 0.12)",
        border: "rgb(248 113 113 / 0.3)",
    },
    neutral: {
        icon: CircleDashed,
        color: "var(--ink-muted)",
        tint: "rgb(255 255 255 / 0.04)",
        border: "var(--deck-hairline)",
    },
};
export function StatusPill({ tone, label, className, }) {
    const { icon: Icon, color, tint, border } = TONES[tone];
    return (<span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.75rem] font-medium", className)} style={{ color, backgroundColor: tint, borderColor: border }}>
      <Icon aria-hidden className="size-3"/>
      {label}
    </span>);
}
