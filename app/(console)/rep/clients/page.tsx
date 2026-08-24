import type { Metadata } from "next";

import { RepClientsView } from "./clients-view";

export const metadata: Metadata = { title: "My Clients" };

/** /rep/clients — see app/(console)/rep/page.tsx for the pattern. */
export default function RepClientsPage() {
  return <RepClientsView />;
}
