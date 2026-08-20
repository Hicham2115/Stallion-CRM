"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CornerDownRight } from "lucide-react";

import { LeadCard } from "@/components/admin/pipeline/lead-card";
import { StatusDot } from "@/components/deck/status-dot";
import { boardConfig } from "@/config/board";
import { stageColor, type PipelineStage } from "@/config/pipeline";
import { template } from "@/lib/format";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

const { content, features } = boardConfig;

/**
 * One kanban column: a stage, its leads, and a drop target.
 *
 * ============================================================================
 *  WHY `isOver` IS A PROP AND NOT `useDroppable().isOver`
 * ============================================================================
 *  This is the fix for "I can't see where the card is going".
 *
 *  The column registers as a droppable, but so does every CARD inside it (they
 *  are sortable items). With `closestCorners`, whichever is nearest the pointer
 *  wins — and while dragging across a populated column the pointer is almost
 *  always over a card, not the column's own empty space. So the column's own
 *  `isOver` stayed false for the entire drag and the target never lit up. It
 *  only worked when aiming at the sliver of blank space below the last card,
 *  which is not where anybody aims.
 *
 *  The board already resolves a card-hit back to its owning stage
 *  (`resolveStageId`), so that answer is passed down here instead. One source
 *  of truth for "what will receive this drop", shared by the highlight, the
 *  placeholder, and the drop handler itself — they cannot disagree.
 *
 *  `useDroppable` is still needed: it is what makes the column's empty area a
 *  valid target at all, which matters for an empty column.
 * ============================================================================
 */
export function StageColumn({
  stage,
  leads,
  /** Id of the card currently being dragged, so it can render as a ghost. */
  activeId,
  /** True when a drop here would land in THIS column. Resolved by the board. */
  isOver = false,
  /** The lead being dragged, for the placeholder label. */
  activeLead,
  dimmed = false,
}: {
  stage: PipelineStage;
  leads: Lead[];
  activeId: string | null;
  isOver?: boolean;
  activeLead?: Lead;
  /** Terminal-loss columns are de-emphasised — they are not a step forward. */
  dimmed?: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
    data: { stageId: stage.id },
  });

  // Only show the placeholder when the card would actually MOVE. Hovering the
  // column it already lives in is not a pending change, and promising one there
  // would be noise on every drag that gets picked up and put back.
  const showPlaceholder =
    features.dropPreview &&
    isOver &&
    Boolean(activeLead) &&
    activeLead?.stageId !== stage.id;

  return (
    <section
      className={cn(
        "flex min-w-[15rem] flex-1 flex-col rounded-2xl border transition-colors",
        isOver
          ? "border-brand/60 bg-brand/[0.06]"
          : "border-hairline bg-deck-surface",
        dimmed && !isOver && "opacity-70",
      )}
    >
      {/* ---------------------------------------------------------------- */}
      {/* Column header                                                     */}
      {/* ---------------------------------------------------------------- */}
      <header
        className={cn(
          "flex items-center justify-between gap-2 border-b px-3.5 py-3 transition-colors",
          isOver ? "border-brand/30" : "border-hairline",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <StatusDot color={stageColor(stage)} />
          <h3
            className={cn(
              "truncate text-[0.8125rem] font-medium transition-colors",
              isOver ? "text-brand" : "text-ink-soft",
            )}
          >
            {stage.label}
          </h3>
        </span>

        <span
          className={cn(
            "deck-nums shrink-0 rounded-full px-2 py-0.5 font-mono text-[0.625rem] transition-colors",
            isOver ? "bg-brand/20 text-brand" : "bg-white/[0.06] text-ink-muted",
          )}
        >
          {leads.length}
        </span>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Cards                                                             */}
      {/* ---------------------------------------------------------------- */}
      <div
        ref={setNodeRef}
        className="deck-scroll flex min-h-[7rem] flex-1 flex-col gap-2.5 overflow-y-auto p-2.5"
      >
        <SortableContext
          items={leads.map((lead) => lead.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              dragging={activeId === lead.id}
            />
          ))}
        </SortableContext>

        {/* The landing slot.
            Deliberately at the END of the list and labelled with the lead's
            name, rather than opening a gap at the pointer. A gap would promise
            a position this board does not actually honour — a moved lead keeps
            its place in the underlying order, so it can reappear anywhere in
            the column. Saying "this column" precisely beats implying a rank
            that turns out to be wrong the moment you let go. */}
        {showPlaceholder && activeLead && (
          <p className="flex items-center gap-2 rounded-xl border border-dashed border-brand/60 bg-brand/[0.07] px-3 py-3 text-[0.75rem] text-brand">
            <CornerDownRight aria-hidden className="size-3.5 shrink-0" />
            <span className="truncate">
              {template(content.dropHerePreview, { name: activeLead.name })}
            </span>
          </p>
        )}

        {leads.length === 0 && !showPlaceholder && (
          <p
            className={cn(
              "grid flex-1 place-items-center rounded-xl border border-dashed text-[0.75rem] transition-colors",
              isOver
                ? "border-brand/50 text-brand"
                : "border-hairline text-ink-muted",
            )}
          >
            {content.emptyColumn}
          </p>
        )}
      </div>
    </section>
  );
}
