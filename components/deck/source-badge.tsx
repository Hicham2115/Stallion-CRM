import { cn } from "@/lib/utils";

/**
 * A lead's source, as a pill.
 *
 * DELIBERATELY NEUTRAL GREY, for every source, always. The obvious instinct is
 * to colour-code the eight sources, and it is the wrong one: eight hues cannot
 * be told apart at pill size, nothing about "Instagram" implies a particular
 * colour, and a colourblind or greyscale reader gets nothing from any of it.
 * All it would add is eight competing accents on a screen whose entire visual
 * budget is spent on one lime. The text is the information.
 *
 * The console's reserved status palette (--status-good / warning / critical)
 * exists for things that genuinely have a good/bad reading. A lead source does
 * not — a walk-in is not worse than a referral, just rarer.
 */
export function SourceBadge({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border border-hairline bg-white/[0.04] px-2.5 py-0.5 text-[0.75rem] text-ink-soft",
        className,
      )}
    >
      {source}
    </span>
  );
}
