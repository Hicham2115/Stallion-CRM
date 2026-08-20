"use client";

import { cn } from "@/lib/utils";

/**
 * A two-or-more-way view switch.
 *
 * WHY IT LOOKS LIKE A CONTROL. In the prototype "Kanban / Funnel" was rendered
 * as two words with a slash between them — indistinguishable from a caption,
 * so nothing suggested the view could be changed at all. What is interactive
 * has to look interactive.
 *
 * Built as radios rather than buttons. A segmented control IS a single choice
 * from a set, and radio semantics give that for free: arrow keys move between
 * options, the group is announced as one control with a name, and the selected
 * state is real rather than a `aria-pressed` approximation. Tab enters and
 * leaves the whole group as one stop, which is what you want — three tab stops
 * to cross a view switch is noise.
 */
export function SegmentedControl<Value extends string>({
  value,
  onValueChange,
  options,
  /** Accessible name for the group, e.g. "Board view". */
  label,
  className,
}: {
  value: Value;
  onValueChange: (value: Value) => void;
  options: Array<{ value: Value; label: string; icon?: React.ReactNode }>;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-hairline bg-white/[0.03] p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            // Roving tabindex: only the selected option is in the tab order, so
            // the group is one stop and the arrow keys do the rest.
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(option.value)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();

              const index = options.findIndex((entry) => entry.value === value);
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % options.length
                  : (index - 1 + options.length) % options.length;

              onValueChange(options[next].value);
              // Move focus with the selection, or the roving tabindex leaves
              // focus on a control that is no longer the active one.
              const group = event.currentTarget.parentElement;
              const target = group?.children[next];
              if (target instanceof HTMLElement) target.focus();
            }}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[0.8125rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
              active
                ? "bg-brand text-deck-void"
                : "text-ink-muted hover:bg-white/[0.05] hover:text-ink-soft",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
