import { initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 *  INITIALS AVATAR — the console's one stand-in for a person
 * ============================================================================
 *  Used by the topbar account block, the conversation header, the leaderboard,
 *  the rep roster and every kanban card. It was five near-copies of the same
 *  span across those files, at four sizes and three font sizes — so a person
 *  looked slightly different depending on which screen they appeared on.
 *
 *  IT IS TINTED, NEVER FILLED. A solid lime disc is a lime-filled element, and
 *  the console spends its one lime fill on the active navigation item — see the
 *  One Lime Answer Rule in DESIGN.md. An avatar marks an identity; it is
 *  neither an action nor a location, so it takes the accent as a tint.
 *
 *  DECORATIVE BY DEFAULT. The person's name is beside it everywhere it is used,
 *  so the initials are hidden from assistive tech — hearing "SB" before
 *  "Soukaina Berrada" is noise, not information. Pass `label` only where the
 *  avatar has to stand on its own.
 * ============================================================================
 */

/** To add a size, add a step here — never a one-off `size-*` at the call site. */
const SIZES = {
  /** Kanban cards. */
  sm: "size-7",
  /** Table rows: leaderboard, rep roster. */
  md: "size-8",
  /** Conversation header. */
  lg: "size-9",
  /** Topbar account block. */
  xl: "size-10",
} as const;

export function InitialsAvatar({
  name,
  size = "md",
  label,
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  /** Accessible name. Omit wherever the person's name is already adjacent. */
  label?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-brand/15 font-mono text-[0.625rem] font-medium text-brand",
        SIZES[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
