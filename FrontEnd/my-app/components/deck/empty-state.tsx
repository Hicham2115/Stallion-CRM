import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * What a list shows when it has nothing in it.
 *
 * Every list in the console gets one. An empty table that renders as a bare
 * header row looks broken — the user cannot tell whether there is no data, the
 * filter is too narrow, or the page failed to load. Saying which, and offering
 * the next action, is the difference.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  /** One line. Say why it is empty, not just that it is. */
  description?: string;
  /** The obvious next step, e.g. an "Add client" button. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="grid size-10 place-items-center rounded-xl border border-hairline bg-white/[0.03]">
          <Icon aria-hidden className="size-4 text-ink-muted" />
        </span>
      )}
      <div>
        <p className="text-sm font-medium text-ink-soft">{title}</p>
        {description && (
          <p className="mt-1 max-w-xs text-[0.8125rem] leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
