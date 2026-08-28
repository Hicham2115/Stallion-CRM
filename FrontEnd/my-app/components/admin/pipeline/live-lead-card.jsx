"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, TriangleAlert } from "lucide-react";
import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { SourceBadge } from "@/components/deck/source-badge";
import { boardConfig } from "@/config/board";
import { clientsConfig } from "@/config/clients";
import { daysInStage } from "@/config/pipeline-live";
import { formatDaysInStage, template } from "@/lib/format";
import { cn } from "@/lib/utils";
const { content, features } = boardConfig;

// Same shape as the mock board's LeadCard (drag handle separate from the
// body, stale marker past staleAfterDays) — only the data source and the
// click target (opens LeadDetailsDialog instead of navigating) differ.
export function LiveLeadCard({
  lead,
  onOpenDetails,
  dragging = false,
  overlay = false,
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } =
    useSortable({
      id: lead.id,
      data: { stage: lead.stage },
      disabled: overlay || !features.dragAndDrop,
    });

  const days = daysInStage(lead);
  const stale = features.staleMarkers && days >= clientsConfig.staleAfterDays;
  const source = lead.attribution?.utm_source || "Direct";

  return (
    <article
      ref={overlay ? undefined : setNodeRef}
      style={
        overlay
          ? undefined
          : { transform: CSS.Translate.toString(transform), transition }
      }
      className={cn(
        "group relative rounded-xl border border-hairline bg-white/[0.03] p-3.5 transition-colors",
        !dragging && !overlay && "hover:bg-white/[0.055]",
        dragging && "opacity-35",
        overlay && "deck-lift cursor-grabbing border-brand/40 bg-deck-card",
      )}
    >
      <div className="flex items-start gap-2.5">
        <InitialsAvatar name={lead.full_name} size="sm" />

        <div className="min-w-0 flex-1">
          {overlay ? (
            <p className="truncate text-[0.8125rem] font-medium text-ink">
              {lead.full_name}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => onOpenDetails(lead)}
              className="block truncate rounded text-left text-[0.8125rem] font-medium text-ink outline-none hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              {lead.full_name}
            </button>
          )}

          <p className="mt-0.5 truncate text-[0.75rem] text-ink-muted">
            {lead.business_type ?? "—"}
            {lead.product_type ? ` · ${lead.product_type}` : ""}
          </p>
        </div>

        {features.dragAndDrop && !overlay && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={template(content.dragHandleLabel, { name: lead.full_name })}
            className="-mr-1 -mt-1 grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 active:cursor-grabbing"
          >
            <GripVertical aria-hidden className="size-3.5" />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <SourceBadge source={source} className="px-2 py-0 text-[0.6875rem]" />
          {lead.track && (
            <span className="rounded-full border border-hairline bg-white/[0.03] px-2 py-0.5 text-[0.6875rem] text-ink-muted">
              {lead.track === "low_ticket" ? "Low ticket" : "High ticket"}
            </span>
          )}
        </span>

        <span
          title={stale ? template(content.staleLabel, { days }) : undefined}
          className={cn(
            "deck-nums inline-flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-[0.1em]",
            stale ? "text-[var(--status-warning)]" : "text-ink-muted",
          )}
        >
          {stale && <TriangleAlert aria-hidden className="size-3" />}
          {formatDaysInStage(days)}
        </span>
      </div>
    </article>
  );
}
