"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LOST_REASONS } from "@/config/pipeline-live";

// Interception point for the "lost" drop, not an optimistic move + fixup —
// nothing is sent to the API until a reason is chosen, so cancelling just
// closes the dialog with the board exactly as it was. See live-pipeline-board.tsx.
export function LostReasonDialog({ lead, open, onOpenChange, onConfirm, pending }) {
  const [reason, setReason] = useState("");

  function handleOpenChange(next) {
    if (!next) setReason("");
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark as lost</DialogTitle>
          <DialogDescription>
            {lead ? `Why is ${lead.full_name} being marked lost?` : ""}
          </DialogDescription>
        </DialogHeader>

        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Select a reason" />
          </SelectTrigger>
          <SelectContent>
            {LOST_REASONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!reason || pending}
            onClick={() => onConfirm(reason)}
          >
            {pending ? "Moving…" : "Move to Lost"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
