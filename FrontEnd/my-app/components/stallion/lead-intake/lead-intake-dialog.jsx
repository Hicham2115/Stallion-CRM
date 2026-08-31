"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  LeadIntakeForm,
  LeadIntakeThankYou,
} from "@/components/stallion/lead-intake/lead-intake-form";

export function LeadIntakeDialog({ open, onOpenChange }) {
  const [submitted, setSubmitted] = useState(false);

  function handleOpenChange(next) {
    onOpenChange(next);
    if (!next) {
      // Reset only after the dialog has closed, so an in-progress form never
      // loses its data from an accidental outside click or error state.
      setTimeout(() => setSubmitted(false), 200);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-full overflow-y-auto border border-white/10 bg-[#15181d] p-5 text-white sm:max-w-xl sm:p-6">
        {!submitted && (
          <DialogHeader className="mb-1">
            <DialogTitle className="font-heading text-xl text-white">
              Let&apos;s get started
            </DialogTitle>
            <DialogDescription className="text-white/50">
              A few quick questions so we can route this to the right person.
            </DialogDescription>
          </DialogHeader>
        )}

        {submitted ? (
          <LeadIntakeThankYou />
        ) : (
          <LeadIntakeForm onSubmitted={() => setSubmitted(true)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
