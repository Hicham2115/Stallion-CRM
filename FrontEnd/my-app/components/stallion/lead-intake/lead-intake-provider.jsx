"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { useLeadIntake } from "@/components/stallion/lead-intake/lead-intake-context";
import { LeadIntakeDialog } from "@/components/stallion/lead-intake/lead-intake-dialog";

/** Scoped to the /stallion marketing route — the console has its own
 * QueryClientProvider-equivalent data flow and its own Toaster instance. */
export function LeadIntakeProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  const open = useLeadIntake((s) => s.open);
  const setOpen = useLeadIntake((s) => s.setOpen);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <LeadIntakeDialog open={open} onOpenChange={setOpen} />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
