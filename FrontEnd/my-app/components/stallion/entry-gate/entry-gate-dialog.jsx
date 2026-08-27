"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { User, Mail, Loader2, ArrowRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
import { useAdAttribution } from "@/lib/use-ad-attribution";
import { gateLeadSchema } from "@/lib/validations/lead";

export function EntryGateDialog() {
  const [open, setOpen] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const attribution = useAdAttribution();

  const submitGate = useMutation({
    mutationFn: async (values) => {
      const formData = new FormData();
      formData.append("full_name", values.full_name);
      formData.append("email", values.email);
      formData.append("attribution", JSON.stringify(attribution ?? {}));
      const { data } = await api.post("/api/leads/gate", formData);
      return data;
    },
    onSuccess: () => {
      setOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const parsed = gateLeadSchema.safeParse({ full_name: fullName, email });
  const canContinue = parsed.success;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canContinue || submitGate.isPending) return;
    submitGate.mutate(parsed.data);
  }

  return (
    <Dialog open={open} onOpenChange={() => {}} disablePointerDismissal>
      <DialogContent
        showCloseButton={false}
        className="w-full border border-white/10 bg-[#15181d] p-5 text-white sm:max-w-sm sm:p-6"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-4 top-4 text-white/40 hover:text-white/80"
        >
          <X className="size-4" />
        </button>

        <DialogHeader className="mb-1">
          <DialogTitle className="font-heading text-xl text-white">
            Welcome
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Tell us who you are before you continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gate_full_name">
              <User className="size-3.5 text-white/40" /> Full name
            </Label>
            <Input
              id="gate_full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Smith"
              className="h-11 bg-white/[0.03] text-[15px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gate_email">
              <Mail className="size-3.5 text-white/40" /> Email
            </Label>
            <Input
              id="gate_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              className="h-11 bg-white/[0.03] text-[15px]"
            />
          </div>

          <Button
            type="submit"
            disabled={!canContinue || submitGate.isPending}
            className="h-11 w-full bg-gradient-to-r from-[#65891c] to-[#7a9e2a] font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            {submitGate.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Continuing...
              </>
            ) : (
              <>
                Continue <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
