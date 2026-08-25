import type { Metadata } from "next";

import { BillingView } from "./billing-view";

export const metadata: Metadata = {
  title: "Invoices",
};

/** /portal/billing — see app/(console)/portal/page.tsx for the pattern. */
export default function PortalBillingPage() {
  return <BillingView />;
}
