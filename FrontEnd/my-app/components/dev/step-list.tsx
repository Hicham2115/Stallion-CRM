"use client";

import { useState, type FormEvent } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, Check, GripVertical, ListChecks, X } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/deck/confirm-dialog";
import { EmptyState } from "@/components/deck/empty-state";
import { fieldBase } from "@/components/deck/field";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { useToday } from "@/components/dev/use-today";
import { Button } from "@/components/ui/button";
import { devConfig } from "@/config/dev";
import { formatShortDate, template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { isStepOverdue } from "@/lib/store/selectors";
import type { Lead, Milestone } from "@/lib/types";
import { cn } from "@/lib/utils";

const { content, features } = devConfig;
const copy = content.steps;

/**
 * ============================================================================
 *  PROJECT STEPS
 * ============================================================================
 *  The checklist a developer works through, and the thing a client reads as
 *  their progress. One list, two audiences.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  A CHECKBOX HERE, THREE STATES THERE
 *  ─────────────────────────────────────────────────────────────────────────
 *  A developer ticks a box: done, or not done. The client sees Complete / In
 *  progress / Not started. The middle state is DERIVED after every edit by
 *  `normalizeMilestones()` in lib/crm-api.ts — the first unticked step becomes
 *  the one in progress.
 *
 *  That is the whole reason this panel can stay as simple as the design showed
 *  it. Asking a developer to maintain a second marker by hand is the version
 *  that goes stale in a week, leaving a client reading "We're working on
 *  Design" a month after Design shipped.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  WHY DRAG *AND* KEYBOARD
 *  ─────────────────────────────────────────────────────────────────────────
 *  @dnd-kit, matching the pipeline board. Native HTML5 drag is mouse-only in
 *  practice — no touch, no keyboard at all — and a reorder that cannot be done
 *  from a keyboard is a reorder half the team cannot do. Tab to a handle, Space
 *  to lift, arrows to move, Space to drop, Esc to cancel; the live region below
 *  makes that audible.
 *
 *  Every write goes through a store action, so wiring the backend is a change
 *  to lib/crm-api.ts and nothing in this file.
 * ============================================================================
 */
export function StepList({ lead }: { lead: Lead }) {
  const { actions } = useCrm();
  const today = useToday();

  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  /** Spoken after a keyboard reorder — the visual change alone is silent. */
  const [announcement, setAnnouncement] = useState("");
  /** The step a confirmation is open for. */
  const [removing, setRemoving] = useState<Milestone | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // A few pixels of slop, so a click on the handle stays a click and a
      // touch scroll is not swallowed as a drag.
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleToggle(step: Milestone) {
    const next: Milestone = {
      ...step,
      // Only ever `done` or not. The in-progress state is derived — see the
      // note at the top of this file.
      status: step.status === "done" ? "pending" : "done",
    };

    const result = await actions.saveStep(lead, next);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(
      template(next.status === "done" ? copy.doneToast : copy.undoneToast, {
        label: step.label,
      }),
    );
  }

  async function handleRename(step: Milestone, label: string) {
    const trimmed = label.trim();
    if (!trimmed || trimmed === step.label) return;

    const result = await actions.saveStep(lead, { ...step, label: trimmed });
    if (result.ok) toast.success(copy.renameToast);
    else toast.error(result.message);
  }

  async function handleDate(step: Milestone, targetDate: string | null) {
    if (targetDate === step.targetDate) return;
    const result = await actions.saveStep(lead, { ...step, targetDate });
    if (!result.ok) toast.error(result.message);
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();

    const label = draft.trim();
    if (!label) return;

    setAdding(true);
    const result = await actions.addStep(lead, { label });
    setAdding(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    // Cleared and left focused: adding one step is almost always adding three.
    setDraft("");
    toast.success(copy.addToast);
  }

  async function handleRemove(step: Milestone) {
    const result = await actions.removeStep(lead, step.id);
    if (result.ok) toast.success(copy.removeToast);
    else toast.error(result.message);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = lead.milestones.map((step) => step.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;

    const next = ids.slice();
    next.splice(to, 0, next.splice(from, 1)[0]);

    const result = await actions.reorderSteps(lead, next);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    setAnnouncement(
      template(copy.reorderAnnouncement, {
        label: lead.milestones[from].label,
        position: to + 1,
        total: ids.length,
      }),
    );
    toast.success(copy.reorderToast);
  }

  const rows = (
    <ul className="flex flex-col divide-y divide-hairline">
      {lead.milestones.map((step) => (
        <StepRow
          key={step.id}
          step={step}
          overdue={isStepOverdue(step, today)}
          onToggle={() => void handleToggle(step)}
          onRename={(label) => void handleRename(step, label)}
          onDate={(date) => void handleDate(step, date)}
          onRemove={() => setRemoving(step)}
        />
      ))}
    </ul>
  );

  return (
    <Panel>
      <PanelHeader title={copy.title} hint={copy.hint} />

      <PanelBody>
        {lead.milestones.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={copy.emptyTitle}
            description={copy.emptyDescription}
          />
        ) : features.stepReorder ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={lead.milestones.map((step) => step.id)}
              strategy={verticalListSortingStrategy}
            >
              {rows}
            </SortableContext>
          </DndContext>
        ) : (
          rows
        )}

        {/* Reordering is silent to a screen reader without this. */}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* Add a step                                                        */}
        {/* ---------------------------------------------------------------- */}
        <form onSubmit={handleAdd} className="mt-5 flex flex-wrap gap-2.5">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={copy.addPlaceholder}
            aria-label={copy.addPlaceholder}
            className={cn(fieldBase, "h-11 min-w-0 flex-1 px-3.5")}
          />
          <Button
            type="submit"
            size="lg"
            // Disabled on empty rather than accepting a blank step and showing
            // an error afterwards. There is nothing to explain: the field is
            // visibly empty.
            disabled={draft.trim().length === 0 || adding}
            className="h-11 shrink-0 font-semibold"
          >
            {copy.addSubmit}
          </Button>
        </form>
      </PanelBody>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={copy.removeTitle}
        description={copy.removeDescription}
        recordName={removing?.label}
        confirmLabel={copy.removeConfirm}
        pendingLabel={copy.removePending}
        onConfirm={async () => {
          if (removing) await handleRemove(removing);
          setRemoving(null);
        }}
      />
    </Panel>
  );
}

/* --------------------------------------------------------------------------
   One row
   -------------------------------------------------------------------------- */

function StepRow({
  step,
  overdue,
  onToggle,
  onRename,
  onDate,
  onRemove,
}: {
  step: Milestone;
  overdue: boolean;
  onToggle: () => void;
  onRename: (label: string) => void;
  onDate: (date: string | null) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id, disabled: !features.stepReorder });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(step.label);

  const done = step.status === "done";

  return (
    <li
      ref={setNodeRef}
      // The X is zeroed rather than passed through: a vertical list cannot be
      // reordered sideways, and a row drifting horizontally under the pointer
      // only makes the drop target harder to judge. @dnd-kit ships a
      // `restrictToVerticalAxis` modifier that does this, in a fifth package —
      // not worth a dependency for one line.
      style={{
        transform: CSS.Translate.toString(
          transform ? { ...transform, x: 0 } : null,
        ),
        transition,
      }}
      className={cn(
        "group flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0",
        isDragging && "relative z-10 opacity-60",
      )}
    >
      {/* ---- Drag handle ---- */}
      {features.stepReorder && (
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          aria-label={template(copy.dragLabel, { label: step.label })}
          className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-ink-faint transition-colors hover:bg-white/[0.05] hover:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 active:cursor-grabbing"
        >
          <GripVertical aria-hidden className="size-4" />
        </button>
      )}

      {/* ---- The tick ----
          A real <input type="checkbox"> under a painted box: it keeps the
          native role, the native Space key and the native announcement, none of
          which a <div role="checkbox"> gets right for free. */}
      <label className="relative grid size-5 shrink-0 cursor-pointer place-items-center">
        <input
          type="checkbox"
          checked={done}
          onChange={onToggle}
          aria-label={template(copy.toggleLabel, { label: step.label })}
          className="peer absolute inset-0 cursor-pointer appearance-none rounded-md outline-none"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md border border-hairline-strong bg-white/[0.03] transition-colors peer-checked:border-brand peer-checked:bg-brand peer-hover:border-brand/60 peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-deck-surface"
        />
        <Check
          aria-hidden
          strokeWidth={3.5}
          className="pointer-events-none relative size-3.5 text-deck-void opacity-0 transition-opacity peer-checked:opacity-100"
        />
      </label>

      {/* ---- Label ---- */}
      {editing && features.stepRename ? (
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            setEditing(false);
            onRename(draft);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") {
              // Restore before blurring, so the blur handler sees the original
              // and commits nothing.
              setDraft(step.label);
              setEditing(false);
            }
          }}
          aria-label={copy.renameLabel}
          className="deck-input h-8 min-w-0 flex-1 rounded-lg border border-brand/45 bg-white/[0.04] px-2.5 text-[0.875rem] text-ink caret-brand outline-none focus:ring-2 focus:ring-brand/25"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            if (!features.stepRename) return;
            setDraft(step.label);
            setEditing(true);
          }}
          // Not a heading and not a link: it edits in place. Without the title
          // there is nothing at all suggesting the text is interactive.
          title={features.stepRename ? copy.renameLabel : undefined}
          className={cn(
            "min-w-0 flex-1 truncate rounded px-1 py-0.5 text-left text-[0.9375rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
            features.stepRename && "hover:bg-white/[0.04]",
            done ? "text-ink-muted line-through" : "text-ink",
          )}
        >
          {step.label}
        </button>
      )}

      {/* ---- Target date ---- */}
      {features.stepTargetDates && (
        <StepDate
          step={step}
          overdue={overdue}
          onChange={onDate}
        />
      )}

      {/* ---- Remove ---- */}
      <button
        type="button"
        onClick={onRemove}
        // Named, so a screen reader moving between six "Remove" buttons can
        // tell them apart.
        aria-label={`${copy.removeLabel} ${step.label}`}
        className="shrink-0 rounded px-1.5 py-0.5 text-[0.875rem] font-medium text-status-critical/85 transition-colors hover:text-status-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-critical/50"
      >
        {copy.removeLabel}
      </button>
    </li>
  );
}

/* --------------------------------------------------------------------------
   The date control
   -------------------------------------------------------------------------- */

/**
 * A target date, shown as a chip until you click it.
 *
 * WHY A NATIVE `<input type="date">` AND NOT THE SHIPPED CALENDAR COMPONENT.
 * The native control brings its own keyboard handling, its own locale-correct
 * ordering (day/month vs month/day), its own mobile picker and its own screen
 * reader support — and `color-scheme: dark` is already set on :root, so the
 * browser paints the popup dark rather than white. A `<Popover>` + `<Calendar>`
 * would be the first use of both components in this codebase, and would have
 * to re-earn all of that.
 *
 * It stays COLLAPSED until used, because four permanently-visible date fields
 * turn a clean checklist into a form. Most steps never get a date, and the ones
 * that do should stand out.
 */
function StepDate({
  step,
  overdue,
  onChange,
}: {
  step: Milestone;
  overdue: boolean;
  onChange: (date: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  if (open || !step.targetDate) {
    return (
      <span className="flex shrink-0 items-center gap-1">
        <input
          type="date"
          autoFocus={open}
          value={step.targetDate ?? ""}
          onChange={(event) => onChange(event.target.value || null)}
          onBlur={() => setOpen(false)}
          aria-label={`${copy.targetLabel} — ${step.label}`}
          className={cn(
            fieldBase,
            "h-8 w-[9.5rem] px-2.5 text-[0.8125rem]",
            !step.targetDate && "text-ink-muted",
          )}
        />
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${copy.targetLabel} — ${step.label}`}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[0.8125rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
          // Overdue is a state, which is exactly what the reserved critical
          // token is for. It carries an icon and a word as well as the colour.
          overdue
            ? "border-status-critical/30 bg-status-critical/10 text-status-critical"
            : "border-hairline bg-white/[0.03] text-ink-soft hover:border-hairline-strong hover:bg-white/[0.06]",
        )}
      >
        <CalendarDays aria-hidden className="size-3.5 shrink-0" />
        <span className="deck-nums">{formatShortDate(step.targetDate)}</span>
        {overdue && <span className="sr-only">{copy.overdueLabel}</span>}
      </button>

      <button
        type="button"
        onClick={() => onChange(null)}
        aria-label={`${copy.targetClear} — ${step.label}`}
        className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-white/[0.05] hover:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
      >
        <X aria-hidden className="size-3.5" />
      </button>
    </span>
  );
}
