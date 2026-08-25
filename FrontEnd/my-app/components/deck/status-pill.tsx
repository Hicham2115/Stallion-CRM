import { CircleAlert, CircleCheck, CircleDashed, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * ============================================================================
 *  STATUS PILL
 * ============================================================================
 *  The console's one way of showing a good / waiting / bad state. Used by the
 *  invoice list, the milestone list, and the rep active flag.
 *
 *  NEVER COLOUR ALONE. Every tone below ships an icon AND a text label, because
 *  an overdue invoice tinted red and a paid one tinted green are the same pill
 *  to a colourblind reader, and identical again in a printout. That is the
 *  failure this component exists to prevent: in the prototype an overdue
 *  invoice was styled indistinguishably from a paid one, which is the most
 *  expensive thing this screen could get wrong.
 *
 *  Colours come from the reserved --status-* palette in globals.css. Those
 *  three are for status only — never reuse them for a chart series, or the
 *  meaning stops being reliable.
 * ============================================================================
 */

export type StatusTone = "good" | "warning" | "critical" | "neutral";

const TONES: Record<
  StatusTone,
  { icon: LucideIcon; color: string; tint: string; border: string }
> = {
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

export function StatusPill({
  tone,
  label,
  className,
}: {
  tone: StatusTone;
  /** Always required — this is what carries the meaning. */
  label: string;
  className?: string;
}) {
  const { icon: Icon, color, tint, border } = TONES[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.75rem] font-medium",
        className,
      )}
      style={{ color, backgroundColor: tint, borderColor: border }}
    >
      <Icon aria-hidden className="size-3" />
      {label}
    </span>
  );
}
