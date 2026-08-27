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
import { cn } from "@/lib/utils";
const { content, features } = boardConfig;
// Past staleAfterDays the days-in-stage figure turns amber with an icon and
// label, so the most urgent card doesn't look identical to every other one.
// The drag handle is separate from the card body/link — a card that's both a
// link and a drag source makes every click a guess.
export function LeadCard({ lead,
/** True while this card is the one being dragged — it becomes a ghost. */
dragging = false,
/** Renders without drag wiring, for the DragOverlay copy. */
overlay = false, }) {
    // Card is shared by the admin and rep boards, and the same lead is a
    // different page to each — reading the route from the session rather
    // than a prop means every reuser gets correct links automatically.
    const session = useSession();
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, } = useSortable({
        id: lead.id,
        data: { stageId: lead.stageId },
        disabled: overlay || !features.dragAndDrop,
    });
    const stale = features.staleMarkers && lead.daysInStage >= clientsConfig.staleAfterDays;
    return (<article ref={overlay ? undefined : setNodeRef} style={overlay
            ? undefined
            : {
                transform: CSS.Translate.toString(transform),
                transition,
            }} className={cn("group relative rounded-xl border border-hairline bg-white/[0.03] p-3.5 transition-colors", !dragging && !overlay && "hover:bg-white/[0.055]", 
        // Faint outline of where the card was, so the column doesn't
        // collapse and re-flow under the pointer.
        dragging && "opacity-35",
        // The floating copy under the cursor — genuinely above the page,
        // so a cast shadow is correct here. See .deck-lift in globals.css.
        overlay && "deck-lift cursor-grabbing border-brand/40 bg-deck-card")}>
      <div className="flex items-start gap-2.5">
        <InitialsAvatar name={lead.name} size="sm"/>

        <div className="min-w-0 flex-1">
          {overlay ? (<p className="truncate text-[0.8125rem] font-medium text-ink">
              {lead.name}
            </p>) : (<Link href={roleDefinitions[session.role].leadRoute(lead.id)} className="block truncate rounded text-[0.8125rem] font-medium text-ink outline-none hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/60">
              {lead.name}
            </Link>)}

          <p className="mt-0.5 truncate text-[0.75rem] text-ink-muted">
            {lead.company}
          </p>
        </div>

        {features.dragAndDrop && !overlay && (<button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={template(content.dragHandleLabel, { name: lead.name })} className="-mr-1 -mt-1 grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 active:cursor-grabbing">
            <GripVertical aria-hidden className="size-3.5"/>
          </button>)}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <SourceBadge source={lead.source} className="px-2 py-0 text-[0.6875rem]"/>

        <span title={stale
            ? template(content.staleLabel, { days: lead.daysInStage })
            : undefined} className={cn("deck-nums inline-flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-[0.1em]", stale ? "text-[var(--status-warning)]" : "text-ink-muted")}>
          {stale && <TriangleAlert aria-hidden className="size-3"/>}
          {formatDaysInStage(lead.daysInStage)}
        </span>
      </div>
    </article>);
}
