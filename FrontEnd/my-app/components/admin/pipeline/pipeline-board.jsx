"use client";
import { useMemo, useState } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useSensor, useSensors, } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { LeadCard } from "@/components/admin/pipeline/lead-card";
import { StageColumn } from "@/components/admin/pipeline/stage-column";
import { boardConfig } from "@/config/board";
import { consoleConfig } from "@/config/console";
import { pipelineConfig } from "@/config/pipeline";
import { template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
const { content, features } = boardConfig;
// Uses @dnd-kit instead of native HTML5 drag events because the native API has
// no touch or keyboard path. Every drop goes through actions.moveLead ->
// crmApi.moveLeadToStage(), never a direct state mutation, so wiring the real
// backend only touches lib/crm-api.ts. Also doubles as the rep's board: pass
// `leads` to scope it to one person's pipeline (/rep/pipeline); omit it for
// the full database (/admin/pipeline).
export function PipelineBoard({
// A subset, not a filter expression — the caller decides what "mine" means
// (see `selectRepLeads`), so this component never has to know about roles.
leads: scopedLeads, } = {}) {
    const { state, actions } = useCrm();
    const leads = scopedLeads ?? state.leads;
    const [activeId, setActiveId] = useState(null);
    // Held here rather than read from each column's useDroppable().isOver,
    // which only fires over blank space — see the note in stage-column.tsx.
    // Resolving it once keeps the highlight, placeholder, and drop in sync.
    const [overStageId, setOverStageId] = useState(null);
    const sensors = useSensors(useSensor(PointerSensor, {
        // A few pixels of slop, so a click on the handle is still a click and a
        // scroll gesture on touch is not swallowed as a drag.
        activationConstraint: { distance: 6 },
    }), useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    }));
    const labelOf = useMemo(() => {
        const map = new Map(state.stageOrder.map((s) => [s.id, s.label]));
        return (id) => map.get(id) ?? id;
    }, [state.stageOrder]);
    const leadOf = (id) => id ? leads.find((lead) => lead.id === id) : undefined;
    // Columns in store stage order, split into the forward run and the
    // terminal losses. Lost renders as its own group rather than a seventh
    // equal column so the board doesn't read as a process ending in failure.
    const { progression, lost } = useMemo(() => {
        const columns = state.stageOrder.map((entry) => {
            const known = pipelineConfig.stages.find((s) => s.id === entry.id);
            // Store label wins (Settings can rename it); config supplies tone and
            // isWon/isLost. A stage id only present in the persisted order (from
            // before the config caught up) degrades to a neutral column instead
            // of crashing.
            const stage = Object.assign(Object.assign({ tone: "neutral" }, known), { id: entry.id, label: entry.label });
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
    // Spoken during a keyboard drag, since a keyboard user can't see the card
    // lift or the target column light up.
    const announcements = {
        onDragStart: ({ active }) => {
            const lead = leadOf(String(active.id));
            if (!lead)
                return;
            return template(content.announce.start, {
                name: lead.name,
                stage: labelOf(lead.stageId),
            });
        },
        onDragOver: ({ active, over }) => {
            const lead = leadOf(String(active.id));
            if (!lead || !over)
                return;
            return template(content.announce.over, {
                name: lead.name,
                stage: labelOf(resolveStageId(String(over.id))),
            });
        },
        onDragEnd: ({ active, over }) => {
            const lead = leadOf(String(active.id));
            if (!lead || !over)
                return;
            return template(content.announce.end, {
                name: lead.name,
                stage: labelOf(resolveStageId(String(over.id))),
            });
        },
        onDragCancel: ({ active }) => {
            const lead = leadOf(String(active.id));
            if (!lead)
                return;
            return template(content.announce.cancel, {
                name: lead.name,
                stage: labelOf(lead.stageId),
            });
        },
    };
    // A drop target is either a column (its id IS a stage id) or another card
    // (whose stage we look up).
    function resolveStageId(overId) {
        if (state.stageOrder.some((stage) => stage.id === overId))
            return overId;
        return leads.find((lead) => lead.id === overId)?.stageId ?? overId;
    }
    function handleDragStart(event) {
        const id = String(event.active.id);
        setActiveId(id);
        // Seed with the card's current stage so the board is consistent before
        // the first onDragOver fires.
        setOverStageId(leadOf(id)?.stageId ?? null);
    }
    function handleDragOver(event) {
        const { over } = event;
        // `over` is null between columns / outside the board — drop the
        // highlight rather than keep it on a column no longer targeted.
        setOverStageId(over ? resolveStageId(String(over.id)) : null);
    }
    function clearDrag() {
        setActiveId(null);
        setOverStageId(null);
    }
    async function handleDragEnd(event) {
        clearDrag();
        const { active, over } = event;
        if (!over)
            return;
        const lead = leadOf(String(active.id));
        if (!lead)
            return;
        const targetStageId = resolveStageId(String(over.id));
        if (targetStageId === lead.stageId)
            return;
        const fromStageId = lead.stageId;
        const result = await actions.moveLead(lead, targetStageId);
        if (!result.ok) {
            toast.error(template(content.moveFailedToast, { name: lead.name }));
            return;
        }
        const moved = result.data;
        toast.success(template(content.movedToast, {
            name: lead.name,
            stage: labelOf(targetStageId),
        }), features.undoMove
            ? {
                duration: consoleConfig.undoWindowMs,
                action: {
                    label: consoleConfig.content.undoLabel,
                    onClick: () => {
                        // Moves the returned record back, not the pre-move one, so the
                        // activity entry the API appended is preserved.
                        void actions.moveLead(moved, fromStageId).then((undone) => {
                            if (undone.ok) {
                                toast.success(template(content.undoToast, {
                                    name: lead.name,
                                    stage: labelOf(fromStageId),
                                }));
                            }
                        });
                    },
                },
            }
            : undefined);
    }
    const activeLead = leadOf(activeId);
    return (<DndContext id="pipeline-board" sensors={sensors} collisionDetection={closestCorners} accessibility={{ announcements }} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={clearDrag}>
      <div className="flex flex-col gap-4">
        <div className="deck-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {progression.map((column) => (<StageColumn key={column.stage.id} stage={column.stage} leads={column.leads} activeId={activeId} isOver={overStageId === column.stage.id} activeLead={activeLead}/>))}
        </div>

        {lost.length > 0 && (<div>
            <p className="mb-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
              {content.lostGroupLabel}
            </p>
            <div className="deck-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
              {lost.map((column) => (<StageColumn key={column.stage.id} stage={column.stage} leads={column.leads} activeId={activeId} isOver={overStageId === column.stage.id} activeLead={activeLead} dimmed/>))}
            </div>
          </div>)}
      </div>

      {/* DragOverlay positions itself `fixed`; if a page transition ever adds
          a transform to the console shell, this will need a portal to <body>
          to avoid being clipped by the nested scroll containers. */}
      <DragOverlay dropAnimation={null}>
        {activeLead ? <LeadCard lead={activeLead} overlay/> : null}
      </DragOverlay>
    </DndContext>);
}
