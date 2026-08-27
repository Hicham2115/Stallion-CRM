import { LeadIntakeProvider } from "@/components/stallion/lead-intake/lead-intake-provider";

export default function StallionLayout({ children }) {
  return <LeadIntakeProvider>{children}</LeadIntakeProvider>;
}
