import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * ============================================================================
 *  WARNING CHIP — "this is not what it appears to be"
 * ============================================================================
 *  A standing caution marker, not a transient alert. Two things wear it today:
 *  the console's MOCK DATA chip, and the login card's preview-build notice.
 *
 *  Both exist for the same reason. The console persists to localStorage and
 *  the login screen looks like a working door, so each surface can be mistaken
 *  for the real thing at a glance — and the only defence is a marker that is
 *  always on screen rather than an error that appears once you push on it.
 *
 *  It uses --status-warning, the reserved token. This is a state of the
 *  application, not decoration, which is exactly what that palette is for.
 *
 *  NOT FOR ERRORS. An error is something that just happened and can be
 *  dismissed; this is a standing condition. Use the form alert for the former.
 * ============================================================================
 */
export function WarningChip({
  icon: Icon,
  label,
  title,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  /** Native tooltip explaining the condition in full. */
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.18em]",
        "border-status-warning/28 bg-status-warning/10 text-status-warning",
        className,
      )}
    >
      {Icon && <Icon aria-hidden className="size-3" />}
      {label}
    </span>
  );
}
