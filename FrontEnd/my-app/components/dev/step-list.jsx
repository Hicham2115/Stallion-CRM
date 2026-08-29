"use client";
import { useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, ListChecks, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/deck/confirm-dialog";
import { DateInput } from "@/components/deck/date-input";
import { EmptyState } from "@/components/deck/empty-state";
import { fieldBase } from "@/components/deck/field";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { useToday } from "@/components/dev/use-today";
import { Button } from "@/components/ui/button";
import { devConfig } from "@/config/dev";
import { template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { isStepOverdue } from "@/lib/store/selectors";
import { cn } from "@/lib/utils";
const { content, features } = devConfig;
const copy = content.steps;
// The client-facing "In progress" state is derived (not stored) server-side
// by ProjectController::normalizeStatuses — the first unticked step becomes
// the one in progress, so a developer only ever toggles done/not-done here.
// Drag reordering uses @dnd-kit (not native HTML5 drag) for touch + keyboard
// support, matching the pipeline board.
export function StepList({ lead }) {
    const { actions } = useCrm();
    const today = useToday();
    const [draft, setDraft] = useState("");
    const [adding, setAdding] = useState(false);
    // Spoken after a keyboard reorder — the visual change alone is silent.
    const [announcement, setAnnouncement] = useState("");
    const [removing, setRemoving] = useState(null);
    const sensors = useSensors(useSensor(PointerSensor, {
        // A few pixels of slop, so a click on the handle stays a click and a
        // touch scroll is not swallowed as a drag.
        activationConstraint: { distance: 6 },
    }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    async function handleToggle(step) {
        const next = Object.assign(Object.assign({}, step), {
            status: step.status === "done" ? "pending" : "done" });
        const result = await actions.saveStep(lead, next);
        if (!result.ok) {
            toast.error(result.message);
            return;
        }
        toast.success(template(next.status === "done" ? copy.doneToast : copy.undoneToast, {
            label: step.label,
        }));
    }
    async function handleRename(step, label) {
        const trimmed = label.trim();
        if (!trimmed || trimmed === step.label)
            return;
        const result = await actions.saveStep(lead, Object.assign(Object.assign({}, step), { label: trimmed }));
        if (result.ok)
            toast.success(copy.renameToast);
        else
            toast.error(result.message);
    }
    async function handleDate(step, targetDate) {
        if (targetDate === step.targetDate)
            return;
        const result = await actions.saveStep(lead, Object.assign(Object.assign({}, step), { targetDate }));
        if (!result.ok)
            toast.error(result.message);
    }
    async function handleAdd(event) {
        event.preventDefault();
        const label = draft.trim();
        if (!label)
            return;
        setAdding(true);
        const result = await actions.addStep(lead, { label });
        setAdding(false);
        if (!result.ok) {
            toast.error(result.message);
            return;
        }
        setDraft("");
        toast.success(copy.addToast);
    }
    async function handleRemove(step) {
        const result = await actions.removeStep(lead, step.id);
        if (result.ok)
            toast.success(copy.removeToast);
        else
            toast.error(result.message);
    }
    async function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id)
            return;
        const ids = lead.milestones.map((step) => step.id);
        const from = ids.indexOf(String(active.id));
        const to = ids.indexOf(String(over.id));
        if (from === -1 || to === -1)
            return;
        const next = ids.slice();
        next.splice(to, 0, next.splice(from, 1)[0]);
        const result = await actions.reorderSteps(lead, next);
        if (!result.ok) {
            toast.error(result.message);
            return;
        }
        setAnnouncement(template(copy.reorderAnnouncement, {
            label: lead.milestones[from].label,
            position: to + 1,
            total: ids.length,
        }));
        toast.success(copy.reorderToast);
    }
    const rows = (<ul className="flex flex-col divide-y divide-hairline">
      {lead.milestones.map((step) => (<StepRow key={step.id} step={step} overdue={isStepOverdue(step, today)} onToggle={() => void handleToggle(step)} onRename={(label) => void handleRename(step, label)} onDate={(date) => void handleDate(step, date)} onRemove={() => setRemoving(step)}/>))}
    </ul>);
    return (<Panel>
      <PanelHeader title={copy.title} hint={copy.hint}/>

      <PanelBody>
        {lead.milestones.length === 0 ? (<EmptyState icon={ListChecks} title={copy.emptyTitle} description={copy.emptyDescription}/>) : features.stepReorder ? (<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={lead.milestones.map((step) => step.id)} strategy={verticalListSortingStrategy}>
              {rows}
            </SortableContext>
          </DndContext>) : (rows)}

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <form onSubmit={handleAdd} className="mt-5 flex flex-wrap gap-2.5">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={copy.addPlaceholder} aria-label={copy.addPlaceholder} className={cn(fieldBase, "h-11 min-w-0 flex-1 px-3.5")}/>
          <Button type="submit" size="lg" disabled={draft.trim().length === 0 || adding} className="h-11 shrink-0 font-semibold">
            {copy.addSubmit}
          </Button>
        </form>
      </PanelBody>

      <ConfirmDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)} title={copy.removeTitle} description={copy.removeDescription} recordName={removing?.label} confirmLabel={copy.removeConfirm} pendingLabel={copy.removePending} onConfirm={async () => {
            if (removing)
                await handleRemove(removing);
            setRemoving(null);
        }}/>
    </Panel>);
}
function StepRow({ step, overdue, onToggle, onRename, onDate, onRemove, }) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, } = useSortable({ id: step.id, disabled: !features.stepReorder });
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(step.label);
    const done = step.status === "done";
    return (<li ref={setNodeRef}
    // X is zeroed so the row only moves vertically during drag.
    style={{
            transform: CSS.Translate.toString(transform ? Object.assign(Object.assign({}, transform), { x: 0 }) : null),
            transition,
        }} className={cn("group flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0", isDragging && "relative z-10 opacity-60")}>
      {features.stepReorder && (<button ref={setActivatorNodeRef} type="button" {...attributes} {...listeners} aria-label={template(copy.dragLabel, { label: step.label })} className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-ink-faint transition-colors hover:bg-white/[0.05] hover:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 active:cursor-grabbing">
          <GripVertical aria-hidden className="size-4"/>
        </button>)}

      <label className="relative grid size-5 shrink-0 cursor-pointer place-items-center">
        <input type="checkbox" checked={done} onChange={onToggle} aria-label={template(copy.toggleLabel, { label: step.label })} className="peer absolute inset-0 cursor-pointer appearance-none rounded-md outline-none"/>
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-md border border-hairline-strong bg-white/[0.03] transition-colors peer-checked:border-brand peer-checked:bg-brand peer-hover:border-brand/60 peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-deck-surface"/>
        <Check aria-hidden strokeWidth={3.5} className="pointer-events-none relative size-3.5 text-deck-void opacity-0 transition-opacity peer-checked:opacity-100"/>
      </label>

      {editing && features.stepRename ? (<input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => {
                setEditing(false);
                onRename(draft);
            }} onKeyDown={(event) => {
                if (event.key === "Enter")
                    event.currentTarget.blur();
                if (event.key === "Escape") {
                    // Restore before blurring, so the blur handler commits nothing.
                    setDraft(step.label);
                    setEditing(false);
                }
            }} aria-label={copy.renameLabel} className="deck-input h-8 min-w-0 flex-1 rounded-lg border border-brand/45 bg-white/[0.04] px-2.5 text-[0.875rem] text-ink caret-brand outline-none focus:ring-2 focus:ring-brand/25"/>) : (<button type="button" onClick={() => {
                if (!features.stepRename)
                    return;
                setDraft(step.label);
                setEditing(true);
            }} title={features.stepRename ? copy.renameLabel : undefined} className={cn("min-w-0 flex-1 truncate rounded px-1 py-0.5 text-left text-[0.9375rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60", features.stepRename && "hover:bg-white/[0.04]", done ? "text-ink-muted line-through" : "text-ink")}>
          {step.label}
        </button>)}

      {features.stepTargetDates && (<StepDate step={step} overdue={overdue} onChange={onDate}/>)}

      <button type="button" onClick={onRemove} aria-label={`${copy.removeLabel} ${step.label}`} className="shrink-0 rounded px-1.5 py-0.5 text-[0.875rem] font-medium text-status-critical/85 transition-colors hover:text-status-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-critical/50">
        {copy.removeLabel}
      </button>
    </li>);
}
// A target date — the console's branded DateInput (Popover + shadcn
// Calendar) instead of the native <input type="date">, matching the picker
// used for dates elsewhere (see Lead Details' consult/MVP/closing dates).
function StepDate({ step, overdue, onChange, }) {
    return (<span className="flex w-42 shrink-0 items-center gap-1">
      <span className="min-w-0 flex-1">
        <DateInput value={step.targetDate ?? ""} onChange={(event) => onChange(event.target.value || null)} placeholder={copy.targetLabel} ariaLabel={`${copy.targetLabel} — ${step.label}`} className={cn("h-8 px-2.5 text-[0.8125rem]", overdue && "border-status-critical/30 bg-status-critical/10 text-status-critical")}/>
        {overdue && <span className="sr-only">{copy.overdueLabel}</span>}
      </span>

      {step.targetDate && (<button type="button" onClick={() => onChange(null)} aria-label={`${copy.targetClear} — ${step.label}`} className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-white/[0.05] hover:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
        <X aria-hidden className="size-3.5"/>
      </button>)}
    </span>);
}
