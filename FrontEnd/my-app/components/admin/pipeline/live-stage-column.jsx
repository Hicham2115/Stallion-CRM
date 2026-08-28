"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CornerDownRight } from "lucide-react";
import { LiveLeadCard } from "@/components/admin/pipeline/live-lead-card";
import { StatusDot } from "@/components/deck/status-dot";
import { boardConfig } from "@/config/board";
import { liveStageColor } from "@/config/pipeline-live";
import { template } from "@/lib/format";
import { cn } from "@/lib/utils";
const { content, features } = boardConfig;

// Same structure/behavior as the mock board's StageColumn (isOver resolved
// by the board, not useDroppable().isOver — see that file's comment for why).
export function LiveStageColumn({
  stage,
  leads,
  activeId,
  isOver = false,
  activeLead,
  onOpenDetails,
  dimmed = false,
}) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
    data: { stage: stage.id },
  });

  const showPlaceholder =
    features.dropPreview && isOver && Boolean(activeLead) && activeLead?.stage !== stage.id;

  return (
    <section
      className={cn(
        "flex min-w-[15rem] flex-1 flex-col rounded-2xl border transition-colors",
        isOver ? "border-brand/60 bg-brand/[0.06]" : "border-hairline bg-deck-surface",
        dimmed && !isOver && "opacity-70",
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-2 border-b px-3.5 py-3 transition-colors",
          isOver ? "border-brand/30" : "border-hairline",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <StatusDot color={liveStageColor(stage)} />
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

      <div
        ref={setNodeRef}
        className="deck-scroll flex min-h-[7rem] flex-1 flex-col gap-2.5 overflow-y-auto p-2.5"
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LiveLeadCard
              key={lead.id}
              lead={lead}
              onOpenDetails={onOpenDetails}
              dragging={activeId === lead.id}
            />
          ))}
        </SortableContext>

        {showPlaceholder && activeLead && (
          <p className="flex items-center gap-2 rounded-xl border border-dashed border-brand/60 bg-brand/[0.07] px-3 py-3 text-[0.75rem] text-brand">
            <CornerDownRight aria-hidden className="size-3.5 shrink-0" />
            <span className="truncate">
              {template(content.dropHerePreview, { name: activeLead.full_name })}
            </span>
          </p>
        )}

        {leads.length === 0 && !showPlaceholder && (
          <p
            className={cn(
              "grid flex-1 place-items-center rounded-xl border border-dashed text-[0.75rem] transition-colors",
              isOver ? "border-brand/50 text-brand" : "border-hairline text-ink-muted",
            )}
          >
            {content.emptyColumn}
          </p>
        )}
      </div>
    </section>
  );
}
