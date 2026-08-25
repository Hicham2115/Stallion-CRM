"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { LeadIntakeContext } from "@/components/stallion/lead-intake/lead-intake-context";
import { LeadIntakeDialog } from "@/components/stallion/lead-intake/lead-intake-dialog";

/** Scoped to the /stallion marketing route — the console has its own
 * QueryClientProvider-equivalent data flow and its own Toaster instance. */
export function LeadIntakeProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  const [open, setOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <LeadIntakeContext.Provider value={{ open, setOpen }}>
        {children}
        <LeadIntakeDialog open={open} onOpenChange={setOpen} />
        <Toaster position="top-center" richColors />
      </LeadIntakeContext.Provider>
    </QueryClientProvider>
  );
}
