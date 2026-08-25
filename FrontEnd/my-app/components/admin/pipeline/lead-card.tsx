"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, TriangleAlert } from "lucide-react";

import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { SourceBadge } from "@/components/deck/source-badge";
import { boardConfig } from "@/config/board";
import { useSession } from "@/components/console/session-provider";
import { clientsConfig } from "@/config/clients";
import { roleDefinitions } from "@/config/roles";
import { formatDaysInStage, template } from "@/lib/format";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

const { content, features } = boardConfig;

/**
 * One lead on the kanban board.
 *
 * THE AGE MARKER IS THE INFORMATION. In the prototype "13 days in stage" was
 * styled exactly like "1 day in stage" — the most urgent card on the board
 * looked like every other card, so the one thing the board could tell you that
 * a list cannot went unsaid. Past `staleAfterDays` the figure turns amber and
 * gains an icon and a label, so it survives greyscale and a colourblind reader.
 *
 * The whole card is a link to the lead. The DRAG HANDLE IS SEPARATE, not the
 * card body: a card that is both a link and a drag source makes every click a
 * guess, and on touch it makes scrolling the column a coin flip.
 */
export function LeadCard({
  lead,
  /** True while this card is the one being dragged — it becomes a ghost. */
  dragging = false,
  /** Renders without drag wiring, for the DragOverlay copy. */
  overlay = false,
}: {
  lead: Lead;
  dragging?: boolean;
  overlay?: boolean;
}) {
  /**
   * The card is shared by the admin board and the rep board, and the same lead
   * is a different page to each of them. Reading the route from the session
   * rather than taking a prop means every front that ever reuses this board
   * gets correct links without threading one through `PipelineBoard` and
   * `StageColumn` first — and without anyone remembering to.
   *
   * It linked to `/admin/clients/{id}` unconditionally until now, so a rep
   * clicking a card on their own board was sent to a URL their route guard
   * bounced straight back out of.
   */
  const session = useSession();

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({
    id: lead.id,
    data: { stageId: lead.stageId },
    disabled: overlay || !features.dragAndDrop,
  });

  const stale =
    features.staleMarkers && lead.daysInStage >= clientsConfig.staleAfterDays;

  return (
    <article
      ref={overlay ? undefined : setNodeRef}
      style={
        overlay
          ? undefined
          : {
              transform: CSS.Translate.toString(transform),
              transition,
            }
      }
      className={cn(
        "group relative rounded-xl border border-hairline bg-white/[0.03] p-3.5 transition-colors",
        !dragging && !overlay && "hover:bg-white/[0.055]",
        // The card left behind while dragging: a faint outline of where it was,
        // so the column does not collapse and re-flow under the pointer.
        dragging && "opacity-35",
        // The floating copy under the cursor. This is the one place in the
        // console where a cast shadow is correct — it genuinely is above the
        // page. See the .deck-lift note in app/globals.css.
        overlay && "deck-lift cursor-grabbing border-brand/40 bg-deck-card",
      )}
    >
      <div className="flex items-start gap-2.5">
        <InitialsAvatar name={lead.name} size="sm" />

        <div className="min-w-0 flex-1">
          {overlay ? (
            <p className="truncate text-[0.8125rem] font-medium text-ink">
              {lead.name}
            </p>
          ) : (
            <Link
              href={roleDefinitions[session.role].leadRoute(lead.id)}
              className="block truncate rounded text-[0.8125rem] font-medium text-ink outline-none hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              {lead.name}
            </Link>
          )}

          <p className="mt-0.5 truncate text-[0.75rem] text-ink-muted">
            {lead.company}
          </p>
        </div>

        {/* The drag handle. Separate from the link, and the only thing dnd-kit
            listens on — so keyboard focus lands here and space lifts the card
            rather than following the link. */}
        {features.dragAndDrop && !overlay && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={template(content.dragHandleLabel, { name: lead.name })}
            className="-mr-1 -mt-1 grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 active:cursor-grabbing"
          >
            <GripVertical aria-hidden className="size-3.5" />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <SourceBadge
          source={lead.source}
          className="px-2 py-0 text-[0.6875rem]"
        />

        <span
          title={
            stale
              ? template(content.staleLabel, { days: lead.daysInStage })
              : undefined
          }
          className={cn(
            "deck-nums inline-flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-[0.1em]",
            stale ? "text-[var(--status-warning)]" : "text-ink-muted",
          )}
        >
          {stale && <TriangleAlert aria-hidden className="size-3" />}
          {formatDaysInStage(lead.daysInStage)}
        </span>
      </div>
    </article>
  );
}
