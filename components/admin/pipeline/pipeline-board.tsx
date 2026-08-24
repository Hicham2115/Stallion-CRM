"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";

import { LeadCard } from "@/components/admin/pipeline/lead-card";
import { StageColumn } from "@/components/admin/pipeline/stage-column";
import { boardConfig } from "@/config/board";
import { consoleConfig } from "@/config/console";
import { pipelineConfig, type PipelineStage } from "@/config/pipeline";
import { template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import type { Lead } from "@/lib/types";

const { content, features } = boardConfig;

/**
 * ============================================================================
 *  PIPELINE BOARD (KANBAN)
 * ============================================================================
 *  WHY @dnd-kit AND NOT NATIVE HTML5 DRAG EVENTS. The native API is
 *  mouse-only in practice: it does not fire on touch at all, and it has no
 *  keyboard path whatsoever. A board where the primary action is unreachable
 *  without a mouse is not finished. dnd-kit gives all three from one
 *  implementation — pointer, touch, and keyboard (Tab to a handle, Space to
 *  lift, arrows to move, Space to drop, Esc to cancel) — plus the live region
 *  that makes a keyboard drag audible.
 *
 *  EVERY DROP GOES THROUGH THE API BOUNDARY. The handler calls the store
 *  action, which calls `crmApi.moveLeadToStage()`; nothing here mutates state
 *  directly. That is what makes wiring the real backend a change to
 *  lib/crm-api.ts and nothing in this file — including the activity entry,
 *  which the API appends as part of the move.
 *
 *  IT IS ALSO THE REP'S BOARD. Passing `leads` narrows it to one person's
 *  pipeline for /rep/pipeline; omitting it shows the whole database for
 *  /admin/pipeline. One board rather than two, because a second copy is the one
 *  that stops getting the drag fixes — and because the columns, the drop
 *  targets and the stale markers must behave identically for a rep and their
 *  manager or they are looking at two different tools.
 * ============================================================================
 */
export function PipelineBoard({
  /**
   * The leads to show. Defaults to every lead in the store.
   *
   * A SUBSET, not a filter expression: the caller decides what "mine" means
   * (see `selectRepLeads`), so this component never has to know about roles.
   */
  leads: scopedLeads,
}: {
  leads?: Lead[];
} = {}) {
  const { state, actions } = useCrm();

  // One name for "the leads this board is about", used everywhere below.
  const leads = scopedLeads ?? state.leads;
  const [activeId, setActiveId] = useState<string | null>(null);

  /**
   * The stage a drop would land in right now.
   *
   * Held here rather than read from each column's own `useDroppable().isOver`,
   * because that only fires when the pointer is over the column's blank space —
   * see the long note in stage-column.tsx. Resolving it once, at the level that
   * already knows how to map a card-hit back to its stage, is what makes the
   * highlight, the placeholder and the actual drop agree.
   */
  const [overStageId, setOverStageId] = useState<string | null>(null);

  // Keyboard drag needs its own coordinate getter. The default moves the
  // pointer in fixed pixel steps, which on a wide board means holding an arrow
  // key for a second to cross one column; the sortable getter jumps between
  // droppables instead.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // A few pixels of slop, so a click on the handle is still a click and a
      // scroll gesture on touch is not swallowed as a drag.
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /** Stage id -> label, from the store so Settings renames are respected. */
  const labelOf = useMemo(() => {
    const map = new Map(state.stageOrder.map((s) => [s.id, s.label]));
    return (id: string) => map.get(id) ?? id;
  }, [state.stageOrder]);

  const leadOf = (id: string | null): Lead | undefined =>
    id ? leads.find((lead) => lead.id === id) : undefined;

  /**
   * Columns, in the store's stage order, split into the forward run and the
   * terminal losses.
   *
   * Lost is not the stage after Client. Rendering it inline as a seventh equal
   * column — which the prototype did — makes the board read as a seven-step
   * process ending in failure.
   */
  const { progression, lost } = useMemo(() => {
    const columns = state.stageOrder.map((entry) => {
      const known = pipelineConfig.stages.find((s) => s.id === entry.id);

      // The store's label wins (Settings can rename it); the config supplies
      // the tone and the isWon/isLost flags. A stage id that is only in the
      // persisted order — because someone edited it before the config caught
      // up — degrades to a neutral, non-terminal column instead of crashing.
      const stage: PipelineStage = {
        tone: "neutral",
        ...known,
        id: entry.id,
        label: entry.label,
      };

      return {
        stage,
        leads: leads.filter((lead) => lead.stageId === entry.id),
      };
    });

    if (!features.separateLostColumn) {
      return { progression: columns, lost: [] };
    }

    return {
      progression: columns.filter((column) => !column.stage.isLost),
      lost: columns.filter((column) => column.stage.isLost),
    };
  }, [state.stageOrder, leads]);

  /**
   * Spoken during a keyboard drag.
   *
   * A sighted user sees the card lift and the target column light up. Without
   * these, a keyboard user gets silence and has no way to know which column
   * they are over — which would make the keyboard path technically present and
   * practically unusable.
   */
  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      const lead = leadOf(String(active.id));
      if (!lead) return;
      return template(content.announce.start, {
        name: lead.name,
        stage: labelOf(lead.stageId),
      });
    },
    onDragOver: ({ active, over }) => {
      const lead = leadOf(String(active.id));
      if (!lead || !over) return;
      return template(content.announce.over, {
        name: lead.name,
        stage: labelOf(resolveStageId(String(over.id))),
      });
    },
    onDragEnd: ({ active, over }) => {
      const lead = leadOf(String(active.id));
      if (!lead || !over) return;
      return template(content.announce.end, {
        name: lead.name,
        stage: labelOf(resolveStageId(String(over.id))),
      });
    },
    onDragCancel: ({ active }) => {
      const lead = leadOf(String(active.id));
      if (!lead) return;
      return template(content.announce.cancel, {
        name: lead.name,
        stage: labelOf(lead.stageId),
      });
    },
  };

  /**
   * A drop target is either a column (its id IS a stage id) or another card
   * (whose stage we look up). Both are valid drops — people aim at the gap
   * between cards as often as at the column itself.
   */
  function resolveStageId(overId: string): string {
    if (state.stageOrder.some((stage) => stage.id === overId)) return overId;
    return leads.find((lead) => lead.id === overId)?.stageId ?? overId;
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    setActiveId(id);
    // Seed the target with the card's current stage, so the board is in a
    // consistent state for the frame before the first onDragOver fires.
    setOverStageId(leadOf(id)?.stageId ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    // `over` is null between columns / outside the board. Keeping the last
    // target would light up a column the card is no longer heading for, so the
    // highlight is dropped until there is a real one again.
    setOverStageId(over ? resolveStageId(String(over.id)) : null);
  }

  function clearDrag() {
    setActiveId(null);
    setOverStageId(null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    clearDrag();

    const { active, over } = event;
    if (!over) return;

    const lead = leadOf(String(active.id));
    if (!lead) return;

    const targetStageId = resolveStageId(String(over.id));
    // Dropped back where it started: not a move, and not worth a toast.
    if (targetStageId === lead.stageId) return;

    const fromStageId = lead.stageId;

    const result = await actions.moveLead(lead, targetStageId);

    if (!result.ok) {
      toast.error(template(content.moveFailedToast, { name: lead.name }));
      return;
    }

    const moved = result.data;

    toast.success(
      template(content.movedToast, {
        name: lead.name,
        stage: labelOf(targetStageId),
      }),
      features.undoMove
        ? {
            duration: consoleConfig.undoWindowMs,
            action: {
              label: consoleConfig.content.undoLabel,
              onClick: () => {
                // Moves the RETURNED record back, not the pre-move one, so the
                // activity entry the API appended is preserved rather than
                // silently dropped.
                void actions.moveLead(moved, fromStageId).then((undone) => {
                  if (undone.ok) {
                    toast.success(
                      template(content.undoToast, {
                        name: lead.name,
                        stage: labelOf(fromStageId),
                      }),
                    );
                  }
                });
              },
            },
          }
        : undefined,
    );
  }

  const activeLead = leadOf(activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={clearDrag}
    >
      <div className="flex flex-col gap-4">
        {/* The forward run. Horizontal scroll rather than shrinking columns:
            a kanban column below ~15rem cannot show a name and a company. */}
        <div className="deck-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {progression.map((column) => (
            <StageColumn
              key={column.stage.id}
              stage={column.stage}
              leads={column.leads}
              activeId={activeId}
              isOver={overStageId === column.stage.id}
              activeLead={activeLead}
            />
          ))}
        </div>

        {/* Terminal losses, separated and dimmed. */}
        {lost.length > 0 && (
          <div>
            <p className="mb-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
              {content.lostGroupLabel}
            </p>
            <div className="deck-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
              {lost.map((column) => (
                <StageColumn
                  key={column.stage.id}
                  stage={column.stage}
                  leads={column.leads}
                  activeId={activeId}
                  isOver={overStageId === column.stage.id}
                  activeLead={activeLead}
                  dimmed
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* The card under the cursor.
          `DragOverlay` positions itself `fixed`, and nothing on the path from
          here to <body> sets transform / filter / contain, so no ancestor
          establishes a containing block and the nested scroll containers cannot
          clip it. If a page transition ever adds a transform to the console
          shell, this needs a portal to <body> — that is the thing that would
          break it. */}
      <DragOverlay dropAnimation={null}>
        {activeLead ? <LeadCard lead={activeLead} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
