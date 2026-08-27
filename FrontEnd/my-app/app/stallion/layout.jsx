import { LeadIntakeProvider } from "@/components/stallion/lead-intake/lead-intake-provider";
import { EntryGateDialog } from "@/components/stallion/entry-gate/entry-gate-dialog";

export default function StallionLayout({ children }) {
  return (
    <LeadIntakeProvider>
      {children}
      <EntryGateDialog />
    </LeadIntakeProvider>
  );
}
