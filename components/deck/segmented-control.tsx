"use client";

import { cn } from "@/lib/utils";

/**
 * How the selected segment is painted.
 *
 * `accent` is the default: a lime fill, which is the strongest thing on the
 * control and reads instantly. `quiet` exists because of THE ONE LIME ANSWER
 * RULE in DESIGN.md — a screen gets at most one lime fill in its content
 * column, and on /login that fill is already spent on the submit button. A
 * second one beside it would make two controls compete to be the answer to
 * "what do I do here", when only one of them is.
 *
 * Use `quiet` whenever the control sits on a screen that already has a lime
 * primary action.
 */
const TONES = {
  accent: "bg-brand text-deck-void",
  quiet:
    "border border-hairline-strong bg-white/[0.08] text-ink shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05)]",
} as const;

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
  tone = "accent",
  className,
}: {
  value: Value;
  onValueChange: (value: Value) => void;
  options: Array<{ value: Value; label: string; icon?: React.ReactNode }>;
  label: string;
  /** See TONES above. `quiet` for screens that already spend their lime. */
  tone?: keyof typeof TONES;
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
                ? TONES[tone]
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
