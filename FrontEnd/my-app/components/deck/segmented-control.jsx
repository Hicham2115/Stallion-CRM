"use client";
import { cn } from "@/lib/utils";
// `quiet` exists for screens that already spend their one lime fill
// elsewhere (e.g. /login's submit button), so this doesn't compete with it.
const TONES = {
    accent: "bg-brand text-deck-void",
    quiet: "border border-hairline-strong bg-white/[0.08] text-ink shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05)]",
};
// Built as radios, not buttons: a segmented control IS a single choice from
// a set, and radio semantics give arrow-key navigation, group announcement,
// and real selected state for free, with the group as one tab stop.
export function SegmentedControl({ value, onValueChange, options,
/** Accessible name for the group, e.g. "Board view". */
label, tone = "accent", className, }) {
    return (<div role="radiogroup" aria-label={label} className={cn("inline-flex items-center gap-1 rounded-md border border-hairline bg-white/[0.03] p-1", className)}>
      {options.map((option) => {
            const active = option.value === value;
            return (<button key={option.value} type="button" role="radio" aria-checked={active}
            // Roving tabindex: only the selected option is in the tab order.
            tabIndex={active ? 0 : -1} onClick={() => onValueChange(option.value)} onKeyDown={(event) => {
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft")
                        return;
                    event.preventDefault();
                    const index = options.findIndex((entry) => entry.value === value);
                    const next = event.key === "ArrowRight"
                        ? (index + 1) % options.length
                        : (index - 1 + options.length) % options.length;
                    onValueChange(options[next].value);
                    // Move focus with the selection to match the roving tabindex.
                    const group = event.currentTarget.parentElement;
                    const target = group?.children[next];
                    if (target instanceof HTMLElement)
                        target.focus();
                }} className={cn("inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[0.8125rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60", active
                    ? TONES[tone]
                    : "text-ink-muted hover:bg-white/[0.05] hover:text-ink-soft")}>
            {option.icon}
            {option.label}
          </button>);
        })}
    </div>);
}
