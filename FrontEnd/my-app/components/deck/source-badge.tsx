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
/**
 * What an empty source reads as.
 *
 * A record can genuinely have none: the dev workspace can start a project
 * without any sales history, and `source` is a SALES field a developer has no
 * business guessing at. Rendering `""` produced a bare pill with nothing in it,
 * which reads as a rendering bug rather than as an absence.
 */
const UNKNOWN_SOURCE = "Not recorded";

export function SourceBadge({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  const known = source.trim().length > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border border-hairline bg-white/[0.04] px-2.5 py-0.5 text-[0.75rem]",
        known ? "text-ink-soft" : "italic text-ink-muted",
        className,
      )}
    >
      {known ? source : UNKNOWN_SOURCE}
    </span>
  );
}
