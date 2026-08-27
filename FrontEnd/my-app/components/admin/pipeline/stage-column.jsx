"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, } from "@dnd-kit/sortable";
import { CornerDownRight } from "lucide-react";
import { LeadCard } from "@/components/admin/pipeline/lead-card";
import { StatusDot } from "@/components/deck/status-dot";
import { boardConfig } from "@/config/board";
import { stageColor } from "@/config/pipeline";
import { template } from "@/lib/format";
import { cn } from "@/lib/utils";
const { content, features } = boardConfig;
// `isOver` is a prop, not useDroppable().isOver, because every card inside
// is also a droppable sortable item — with closestCorners, the pointer is
// almost always over a card rather than the column's own space while
// dragging across a populated column, so the column's own isOver stayed
// false for the whole drag. The board already resolves a card-hit back to
// its stage (resolveStageId), so that answer is passed down instead — one
// source of truth shared by the highlight, placeholder, and drop handler.
// useDroppable is still needed to make an empty column's area a valid target.
export function StageColumn({ stage, leads,
/** Id of the card currently being dragged, so it can render as a ghost. */
activeId,
/** True when a drop here would land in THIS column. Resolved by the board. */
isOver = false,
/** The lead being dragged, for the placeholder label. */
activeLead, dimmed = false, }) {
    const { setNodeRef } = useDroppable({
        id: stage.id,
        data: { stageId: stage.id },
    });
    // Only show the placeholder when the card would actually move — hovering
    // the column it's already in isn't a pending change.
    const showPlaceholder = features.dropPreview &&
        isOver &&
        Boolean(activeLead) &&
        activeLead?.stageId !== stage.id;
    return (<section className={cn("flex min-w-[15rem] flex-1 flex-col rounded-2xl border transition-colors", isOver
            ? "border-brand/60 bg-brand/[0.06]"
            : "border-hairline bg-deck-surface", dimmed && !isOver && "opacity-70")}>
      <header className={cn("flex items-center justify-between gap-2 border-b px-3.5 py-3 transition-colors", isOver ? "border-brand/30" : "border-hairline")}>
        <span className="flex min-w-0 items-center gap-2">
          <StatusDot color={stageColor(stage)}/>
          <h3 className={cn("truncate text-[0.8125rem] font-medium transition-colors", isOver ? "text-brand" : "text-ink-soft")}>
            {stage.label}
          </h3>
        </span>

        <span className={cn("deck-nums shrink-0 rounded-full px-2 py-0.5 font-mono text-[0.625rem] transition-colors", isOver ? "bg-brand/20 text-brand" : "bg-white/[0.06] text-ink-muted")}>
          {leads.length}
        </span>
      </header>

      <div ref={setNodeRef} className="deck-scroll flex min-h-[7rem] flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
        <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (<LeadCard key={lead.id} lead={lead} dragging={activeId === lead.id}/>))}
        </SortableContext>

        {/* Landing slot sits at the end of the list, not a gap at the pointer
            — a moved lead keeps its place in the underlying order, so a gap
            would promise a rank the board doesn't actually honour. */}
        {showPlaceholder && activeLead && (<p className="flex items-center gap-2 rounded-xl border border-dashed border-brand/60 bg-brand/[0.07] px-3 py-3 text-[0.75rem] text-brand">
            <CornerDownRight aria-hidden className="size-3.5 shrink-0"/>
            <span className="truncate">
              {template(content.dropHerePreview, { name: activeLead.name })}
            </span>
          </p>)}

        {leads.length === 0 && !showPlaceholder && (<p className={cn("grid flex-1 place-items-center rounded-xl border border-dashed text-[0.75rem] transition-colors", isOver
                ? "border-brand/50 text-brand"
                : "border-hairline text-ink-muted")}>
            {content.emptyColumn}
          </p>)}
      </div>
    </section>);
}
