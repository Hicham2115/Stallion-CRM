"use client";

import { useState } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { consoleConfig } from "@/config/console";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 *  CONFIRM DIALOG — the one destructive-action pattern
 * ============================================================================
 *  Every irreversible action in the console goes through this: deleting a
 *  client, deleting a rep. Three things it guarantees, and each one exists
 *  because the prototype was missing it:
 *
 *  1. IT NAMES THE RECORD. "Delete this client?" is a question nobody can
 *     answer safely — the whole risk is that the wrong row was clicked, and a
 *     generic prompt confirms the mistake rather than catching it. "Delete
 *     Soukaina Berrada?" is checkable.
 *
 *  2. IT IS NOT THE ONLY SAFETY NET. Confirmation dialogs are dismissed on
 *     reflex; anyone deleting a third row in a row has stopped reading. That
 *     is what `showUndoToast` is for, and why the two live in one file — a
 *     confirm without an undo is one mis-click from real data loss.
 *
 *  3. IT STAYS OPEN WHILE THE WORK RUNS, with the button in a pending state,
 *     so a slow request cannot be double-submitted.
 *
 *  Base UI's Dialog supplies the focus trap, Esc-to-close, and focus
 *  restoration to the trigger on close, so none of that is reimplemented here.
 * ============================================================================
 */

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  /** What will happen. Say the consequence, not just "are you sure". */
  description,
  /** The record being acted on, shown verbatim so it can be checked. */
  recordName,
  confirmLabel,
  cancelLabel = consoleConfig.content.cancelLabel,
  pendingLabel,
  /** Runs on confirm. The dialog closes only once it resolves. */
  onConfirm,
  /** `false` for a reversible action, e.g. deactivating a rep. */
  destructive = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  recordName?: string;
  confirmLabel: string;
  cancelLabel?: string;
  pendingLabel?: string;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
}) {
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      // Reset even on failure, so a transient error leaves a usable dialog
      // rather than a permanently spinning button.
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Never let a backdrop click or Esc dismiss the dialog mid-request:
        // the work is already in flight and the outcome is about to change.
        if (pending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="border border-hairline bg-deck-card p-6 sm:max-w-md">
        <div className="flex gap-4">
          <span
            aria-hidden
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-xl border",
              // --status-critical, not Tailwind's red ramp: this is the only
              // place in the console that reached outside the reserved status
              // palette, which is what makes a red mean one thing everywhere.
              destructive
                ? "border-status-critical/28 bg-status-critical/10 text-status-critical"
                : "border-hairline bg-white/[0.04] text-ink-muted",
            )}
          >
            <TriangleAlert className="size-[1.15rem]" />
          </span>

          <div className="min-w-0 flex-1">
            <DialogTitle className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
              {title}
            </DialogTitle>

            <DialogDescription className="mt-2 text-[0.8125rem] leading-relaxed text-ink-muted">
              {description}
            </DialogDescription>

            {recordName && (
              // The record itself, set apart from the prose so it is read
              // rather than skimmed past.
              <p className="mt-3 truncate rounded-lg border border-hairline bg-white/[0.03] px-3 py-2 text-[0.875rem] font-medium text-ink">
                {recordName}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="lg"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>

          <Button
            size="lg"
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={handleConfirm}
          >
            {pending ? (
              <>
                <LoaderCircle aria-hidden className="deck-spin size-4" />
                {pendingLabel ?? confirmLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The confirmation toast that follows a destructive action, carrying an Undo.
 *
 * WHY UNDO AND NOT JUST A CONFIRM DIALOG: the dialog catches the mis-click you
 * notice; undo catches the one you notice a second later. They cover different
 * mistakes, which is why both are here.
 *
 * `onUndo` must genuinely restore the record. Today that means re-adding it to
 * the local store, which works because the mock delete is not real.
 *
 * TODO(backend): a real DELETE cannot be undone by re-posting the record — the
 * server assigns a new id and the audit trail now shows a delete and a create.
 * Either soft-delete server-side and have Undo clear the flag, or hold the
 * request for the toast's lifetime and cancel it if Undo is pressed. Decide
 * which before wiring the API, because the honest window is different for each.
 */
export function showUndoToast({
  message,
  onUndo,
  /** Defaults to the console-wide undo window — see consoleConfig.undoWindowMs
   *  for why this is one number and not a per-screen choice. */
  duration = consoleConfig.undoWindowMs,
}: {
  message: string;
  onUndo: () => void | Promise<void>;
  duration?: number;
}) {
  toast.success(message, {
    duration,
    action: {
      label: consoleConfig.content.undoLabel,
      onClick: () => {
        void onUndo();
      },
    },
  });
}
