"use client";
import { CircleAlert } from "lucide-react";
import { liveStageLabel } from "@/config/pipeline-live";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// The real equivalent of ProjectCard — no step checklist or previews exist
// on the backend yet (those stay mock, see config/dev.js), so this shows
// what IS real: stage, MVP deadline, and whether it's overdue. Opens the
// same LeadDetailsDialog every other real screen uses, rather than linking
// to /dev/[leadId] (still mock-only, would 404 on a real lead id).
export function LiveProjectCard({ lead, onOpen }) {
  const overdue =
    lead.mvp_deadline &&
    lead.stage !== "delivered" &&
    new Date(lead.mvp_deadline) < new Date();

  return (
    <button
      type="button"
      onClick={() => onOpen(lead)}
      className={cn(
        "deck-inset group relative flex w-full flex-col rounded-md border border-hairline bg-deck-surface p-5 text-left transition-colors",
        "hover:border-hairline-strong hover:bg-white/[0.035]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deck-void",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
            {lead.full_name}
          </p>
          <p className="mt-0.5 truncate text-[0.875rem] text-ink-muted">
            {lead.business_type ?? "—"}
          </p>
        </div>

        {overdue && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-status-critical/30 bg-status-critical/10 px-2.5 py-0.5 text-[0.75rem] font-medium text-status-critical">
            <CircleAlert aria-hidden className="size-3" />
            Overdue
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-hairline pt-3.5">
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2.5 py-0.5 text-[0.75rem] font-medium",
            lead.stage === "lost"
              ? "bg-red-400/15 text-red-300"
              : "bg-brand/15 text-brand",
          )}
        >
          {liveStageLabel(lead.stage)}
        </span>

        {lead.mvp_deadline && (
          <span className="text-[0.75rem] text-ink-muted">
            Deadline {formatDate(lead.mvp_deadline)}
          </span>
        )}
      </div>
    </button>
  );
}
