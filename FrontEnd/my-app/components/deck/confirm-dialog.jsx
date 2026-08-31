"use client";
import { useState } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { consoleConfig } from "@/config/console";
import { Dialog, DialogContent, DialogDescription, DialogTitle, } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
// The one destructive-action confirm pattern used across the console
// (deleting a client, a rep, ...). Names the record being acted on rather
// than asking a generic "are you sure", and stays open with the button
// pending while the request runs so it can't be double-submitted. Pairs
// with showUndoToast below as the second safety net after the dialog.
export function ConfirmDialog({ open, onOpenChange, title, description, recordName, confirmLabel, cancelLabel = consoleConfig.content.cancelLabel, pendingLabel, onConfirm,
/** `false` for a reversible action, e.g. deactivating a rep. */
destructive = true, }) {
    const [pending, setPending] = useState(false);
    async function handleConfirm() {
        setPending(true);
        try {
            await onConfirm();
            onOpenChange(false);
        }
        finally {
            // Reset even on failure so a transient error doesn't leave a
            // permanently spinning button.
            setPending(false);
        }
    }
    return (<Dialog open={open} onOpenChange={(next) => {
            // Don't let a backdrop click or Esc dismiss mid-request.
            if (pending)
                return;
            onOpenChange(next);
        }}>
      <DialogContent className="border border-hairline bg-deck-card p-6 sm:max-w-md">
        <div className="flex gap-4">
          <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-md border",
        // --status-critical token, not Tailwind's red ramp, so red means one
        // thing everywhere in the console.
        destructive
            ? "border-status-critical/28 bg-status-critical/10 text-status-critical"
            : "border-hairline bg-white/[0.04] text-ink-muted")}>
            <TriangleAlert className="size-[1.15rem]"/>
          </span>

          <div className="min-w-0 flex-1">
            <DialogTitle className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
              {title}
            </DialogTitle>

            <DialogDescription className="mt-2 text-[0.8125rem] leading-relaxed text-ink-muted">
              {description}
            </DialogDescription>

            {recordName && (
        <p className="mt-3 truncate rounded-md border border-hairline bg-white/[0.03] px-3 py-2 text-[0.875rem] font-medium text-ink">
                {recordName}
              </p>)}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="lg" disabled={pending} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>

          <Button size="lg" variant={destructive ? "destructive" : "default"} disabled={pending} onClick={handleConfirm}>
            {pending ? (<>
                <LoaderCircle aria-hidden className="deck-spin size-4"/>
                {pendingLabel ?? confirmLabel}
              </>) : (confirmLabel)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>);
}
// Confirmation toast following a destructive action, carrying an Undo — the
// second safety net after the confirm dialog, for the mis-click noticed a
// second too late.
//
// TODO(backend): onUndo currently just re-adds the record to the local
// store, which only works because the mock delete isn't real. A real DELETE
// can't be undone by re-posting (server assigns a new id, audit trail shows
// delete+create) — decide between soft-delete-and-clear-flag or
// hold-and-cancel-the-request before wiring the API.
export function showUndoToast({ message, onUndo, duration = consoleConfig.undoWindowMs, }) {
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
